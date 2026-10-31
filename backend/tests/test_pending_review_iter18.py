# Iteration 18: auto rating prompt — GET /api/bookings/pending-review (+ interplay with POST /bookings/{id}/review)
import os
import random
import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BASE_URL = os.environ.get("EXPO_BACKEND_URL").rstrip("/") + "/api"
ENV = dotenv_values("/app/backend/.env")
mdb = MongoClient(ENV["MONGO_URL"])[ENV["DB_NAME"]]
FUTURE = (date.today() + timedelta(days=random.randint(30, 900))).isoformat()


def login(phone, role="customer"):
    r = requests.post(f"{BASE_URL}/auth/otp/send", json={"phone": phone})
    assert r.status_code == 200, r.text
    code = r.json().get("dev_code") or "123456"
    r = requests.post(f"{BASE_URL}/auth/otp/verify", json={"phone": phone, "code": code, "role": role})
    assert r.status_code == 200, r.text
    return r.json()


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


def iso(days_ago=0, minutes_ago=0):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago, minutes=minutes_ago)).isoformat()


@pytest.fixture(scope="module")
def ctx():
    d = {k: login(p) for k, p in {"owner": "9000000001", "driver": "9000000002", "customer": "9000000003"}.items()}
    fresh = login("95" + str(uuid.uuid4().int)[:8], "customer")
    out = {k: v["token"] for k, v in d.items()}
    out |= {"driver_id": d["driver"]["user"]["id"], "fresh": fresh["token"], "fresh_id": fresh["user"]["id"]}
    yield out
    mdb.bookings.delete_many({"customer_id": fresh["user"]["id"]})
    mdb.reviews.delete_many({"customer_id": fresh["user"]["id"]})
    mdb.otp_requests.delete_many({})


def insert_booking(ctx, status="COMPLETED", driver=True, updated_at=None, ref=None):
    bid = str(uuid.uuid4())
    mdb.bookings.insert_one({"id": bid, "ref": ref or ("TEST" + bid[:6].upper()), "customer_id": ctx["fresh_id"],
                             "service_id": "hourly", "service_name": "Hourly driver", "city_id": "mumbai",
                             "date": "2020-01-01", "time": "10:00", "status": status, "payment_status": "PAID",
                             "driver_id": ctx["driver_id"] if driver else None, "pickup": "TEST_ pickup",
                             "created_at": updated_at or iso(), "updated_at": updated_at or iso()})
    return bid


def pending(tok):
    r = requests.get(f"{BASE_URL}/bookings/pending-review", headers=H(tok))
    assert r.status_code == 200, r.text
    return r.json()


class TestPendingReviewAccess:
    def test_demo_customer_shape(self, ctx):
        data = pending(ctx["customer"])
        assert "booking" in data
        b = data["booking"]
        if b is None:
            pytest.skip("demo customer has no unrated completed trip right now")
        assert set(b) >= {"id", "ref", "service_name", "date", "driver"}
        assert isinstance(b["driver"]["name"], str) and b["driver"]["name"]
        assert "photo_url" in b["driver"]
        assert "_id" not in str(data)
        # must be truly completed and unrated
        detail = requests.get(f"{BASE_URL}/bookings/{b['id']}", headers=H(ctx["customer"])).json()
        assert detail["status"] == "COMPLETED" and detail["review"] is None

    def test_driver_and_owner_forbidden(self, ctx):
        for role in ("driver", "owner"):
            r = requests.get(f"{BASE_URL}/bookings/pending-review", headers=H(ctx[role]))
            assert r.status_code == 403, (role, r.status_code, r.text)

    def test_unauthenticated(self):
        assert requests.get(f"{BASE_URL}/bookings/pending-review").status_code in (401, 403)

    def test_fresh_customer_null(self, ctx):
        assert pending(ctx["fresh"]) == {"booking": None}


class TestPendingReviewLogic:
    def test_filters_and_ordering(self, ctx):
        insert_booking(ctx, updated_at=iso(days_ago=20))          # too old
        insert_booking(ctx, status="IN_PROGRESS")                  # not completed
        insert_booking(ctx, driver=False)                          # no driver
        assert pending(ctx["fresh"]) == {"booking": None}
        older = insert_booking(ctx, updated_at=iso(minutes_ago=60))
        newer = insert_booking(ctx, updated_at=iso(minutes_ago=1))
        b = pending(ctx["fresh"])["booking"]
        assert b["id"] == newer
        prof = mdb.driver_profiles.find_one({"user_id": ctx["driver_id"]})
        assert b["driver"]["name"] == prof["name"]
        # rate newer -> next unrated (older) returned
        r = requests.post(f"{BASE_URL}/bookings/{newer}/review", json={"rating": 5, "comment": "TEST_ great", "tags": ["Polite"]},
                          headers=H(ctx["fresh"]))
        assert r.status_code == 200, r.text
        assert pending(ctx["fresh"])["booking"]["id"] == older
        r = requests.post(f"{BASE_URL}/bookings/{older}/review", json={"rating": 4}, headers=H(ctx["fresh"]))
        assert r.status_code == 200, r.text
        assert pending(ctx["fresh"]) == {"booking": None}
        # review persisted on detail
        rv = requests.get(f"{BASE_URL}/bookings/{newer}", headers=H(ctx["fresh"])).json()["review"]
        assert rv["rating"] == 5 and rv["tags"] == ["Polite"]

    def test_other_customer_isolated(self, ctx):
        bid = insert_booking(ctx, updated_at=iso(minutes_ago=0))
        demo = pending(ctx["customer"])["booking"]
        assert demo is None or demo["id"] != bid
        assert requests.post(f"{BASE_URL}/bookings/{bid}/review", json={"rating": 5}, headers=H(ctx["customer"])).status_code == 404
        mdb.bookings.delete_one({"id": bid})


class TestPendingReviewRealTrip:
    def test_driver_completes_trip_then_prompt(self, ctx):
        c, o, d = H(ctx["fresh"]), H(ctx["owner"]), H(ctx["driver"])
        r = requests.post(f"{BASE_URL}/bookings", json={"service_id": "hourly", "city_id": "mumbai", "pickup": "TEST_ Colaba",
                                                       "date": FUTURE, "time": "11:00", "hours": 4,
                                                       "idempotency_key": str(uuid.uuid4()), "contact_name": "TEST_ Rater"}, headers=c)
        assert r.status_code == 200, r.text
        b = r.json()
        assert requests.post(f"{BASE_URL}/admin/bookings/{b['id']}/cash", json={"amount": b["fare"]["advance"]}, headers=o).status_code == 200
        cb = requests.get(f"{BASE_URL}/bookings/{b['id']}", headers=c).json()
        r = requests.post(f"{BASE_URL}/admin/bookings/{b['id']}/assign", json={"driver_id": ctx["driver_id"]}, headers=o)
        assert r.status_code == 200, r.text
        offer = next(x for x in requests.get(f"{BASE_URL}/driver/offers", headers=d).json() if x["booking_id"] == b["id"])
        assert requests.post(f"{BASE_URL}/driver/offers/{offer['id']}/accept", headers=d).status_code == 200
        assert requests.post(f"{BASE_URL}/driver/jobs/{b['id']}/arrive", headers=d).status_code == 200
        assert requests.post(f"{BASE_URL}/driver/jobs/{b['id']}/start", json={"otp": cb["trip_otp"]}, headers=d).status_code == 200
        assert pending(ctx["fresh"]) == {"booking": None}  # in progress -> no prompt
        r = requests.post(f"{BASE_URL}/driver/jobs/{b['id']}/complete", json={"end_pin": cb.get("end_otp", "")}, headers=d)
        assert r.status_code == 200, r.text
        p = pending(ctx["fresh"])["booking"]
        assert p and p["id"] == b["id"] and p["ref"] == b["ref"]
        requests.post(f"{BASE_URL}/bookings/{b['id']}/review", json={"rating": 5}, headers=c)
        assert pending(ctx["fresh"]) == {"booking": None}
