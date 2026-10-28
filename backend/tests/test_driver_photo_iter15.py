# Iteration 15: Driver photo profiles — upload, private file access, public approved-only, staff review, booking photo_url
import io
import os
import sys

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', os.environ.get('EXPO_BACKEND_URL', '')).rstrip('/')
OTP = "123456"
ENV = dotenv_values("/app/backend/.env")
DB = MongoClient(ENV["MONGO_URL"])[ENV["DB_NAME"]]
sys.path.insert(0, "/app/backend")


def _img(color=(200, 30, 30), fmt="JPEG"):
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color).save(buf, fmt)
    return buf.getvalue()


def _login(phone):
    DB.otp_requests.delete_many({})
    r = requests.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": phone, "code": OTP})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def ctx():
    if not BASE_URL:
        pytest.skip("backend URL env not set")
    drv = _login("9000000002")
    own = _login("9000000001")
    cus = _login("9000000003")
    from core import make_token
    other = DB.users.find_one({"phone": "+917000000001"}, {"_id": 0, "id": 1})
    did = drv["user"]["id"]
    backup = DB.driver_profiles.find_one({"user_id": did}, {"_id": 0, "photo": 1, "approved_photo": 1})
    bk = DB.bookings.find_one({"customer_id": cus["user"]["id"], "driver_id": did, "status": {"$ne": "CANCELLED"}}, {"_id": 0, "id": 1})
    c = {"drv": drv["token"], "own": own["token"], "cus": cus["token"], "other": make_token(other["id"]) if other else None,
         "did": did, "booking": bk["id"] if bk else None, "ids": {}}
    yield c
    # teardown: restore original photo state
    unset = {k: "" for k in ("photo", "approved_photo") if k not in (backup or {})}
    upd = {"$set": backup} if backup else {}
    if unset:
        upd["$unset"] = unset
    if upd:
        DB.driver_profiles.update_one({"user_id": did}, upd)


def H(t):
    return {"Authorization": f"Bearer {t}"}


def _upload(t, data, ctype, name="p.jpg"):
    return requests.post(f"{BASE_URL}/api/driver/photo", headers=H(t), files={"file": (name, data, ctype)})


# Upload validation
def test_reject_pdf(ctx):
    r = _upload(ctx["drv"], b"%PDF-1.4 fake", "application/pdf", "a.pdf")
    assert r.status_code == 400, r.text


def test_reject_text(ctx):
    r = _upload(ctx["drv"], b"hello", "text/plain", "a.txt")
    assert r.status_code == 400


def test_reject_too_large(ctx):
    r = _upload(ctx["drv"], b"\xff\xd8" + b"0" * (8 * 1024 * 1024 + 10), "image/jpeg")
    assert r.status_code == 400 and "large" in r.text.lower()


def test_customer_cannot_upload(ctx):
    r = _upload(ctx["cus"], _img(), "image/jpeg")
    assert r.status_code == 403


def test_upload_jpeg_pending(ctx):
    r = _upload(ctx["drv"], _img(), "image/jpeg")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "PENDING" and d["id"] and "path" not in d
    ctx["ids"]["p1"] = d["id"]


# Private file access
def test_private_file_access(ctx):
    pid = ctx["ids"]["p1"]
    u = f"{BASE_URL}/api/driver/photo/file/{pid}"
    r = requests.get(u, params={"token": ctx["drv"]})
    assert r.status_code == 200 and r.headers["content-type"].startswith("image/jpeg") and len(r.content) > 100
    assert requests.get(u, params={"token": ctx["own"]}).status_code == 200
    assert requests.get(u, params={"token": ctx["cus"]}).status_code == 404
    if ctx["other"]:
        assert requests.get(u, params={"token": ctx["other"]}).status_code == 404
    assert requests.get(u).status_code == 401


def test_public_404_while_pending(ctx):
    assert requests.get(f"{BASE_URL}/api/public/driver-photo/{ctx['ids']['p1']}").status_code == 404


def test_profile_and_admin_hide_path(ctx):
    p = requests.get(f"{BASE_URL}/api/driver/profile", headers=H(ctx["drv"])).json()
    assert p["photo"]["id"] == ctx["ids"]["p1"] and "path" not in p["photo"]
    a = requests.get(f"{BASE_URL}/api/admin/drivers/{ctx['did']}", headers=H(ctx["own"])).json()
    assert a["photo"]["status"] == "PENDING" and "path" not in a["photo"]
    lst = requests.get(f"{BASE_URL}/api/admin/drivers", headers=H(ctx["own"])).json()
    me = next(x for x in lst if x["user_id"] == ctx["did"])
    assert "path" not in (me.get("photo") or {})


def test_booking_photo_null_before(ctx):
    if not ctx["booking"]:
        pytest.skip("no booking for customer+driver")
    b = requests.get(f"{BASE_URL}/api/bookings/{ctx['booking']}", headers=H(ctx["cus"])).json()
    assert b["driver"] and b["driver"]["photo_url"] is None


# Review
def test_review_permissions(ctx):
    r = requests.post(f"{BASE_URL}/api/admin/drivers/{ctx['did']}/photo", headers=H(ctx["cus"]), json={"approve": True})
    assert r.status_code == 403
    r = requests.post(f"{BASE_URL}/api/admin/drivers/{ctx['did']}/photo", headers=H(ctx["drv"]), json={"approve": True})
    assert r.status_code == 403


def test_reject_without_reason(ctx):
    r = requests.post(f"{BASE_URL}/api/admin/drivers/{ctx['did']}/photo", headers=H(ctx["own"]), json={"approve": False, "reason": "  "})
    assert r.status_code == 400


def test_reject_with_reason(ctx):
    r = requests.post(f"{BASE_URL}/api/admin/drivers/{ctx['did']}/photo", headers=H(ctx["own"]), json={"approve": False, "reason": "TEST_Face not clear"})
    assert r.status_code == 200 and r.json()["status"] == "REJECTED"
    p = requests.get(f"{BASE_URL}/api/driver/profile", headers=H(ctx["drv"])).json()["photo"]
    assert p["status"] == "REJECTED" and p["reason"] == "TEST_Face not clear"
    assert requests.get(f"{BASE_URL}/api/public/driver-photo/{ctx['ids']['p1']}").status_code == 404
    n = requests.get(f"{BASE_URL}/api/notifications", headers=H(ctx["drv"])).json()
    items = n if isinstance(n, list) else n.get("items", n.get("notifications", []))
    assert any("not approved" in x["title"].lower() for x in items[:5])


def test_approve(ctx):
    r = requests.post(f"{BASE_URL}/api/admin/drivers/{ctx['did']}/photo", headers=H(ctx["own"]), json={"approve": True})
    assert r.status_code == 200 and r.json()["status"] == "APPROVED"
    p = requests.get(f"{BASE_URL}/api/driver/profile", headers=H(ctx["drv"])).json()["photo"]
    assert p["status"] == "APPROVED" and p["reason"] is None
    r = requests.get(f"{BASE_URL}/api/public/driver-photo/{ctx['ids']['p1']}")
    assert r.status_code == 200 and r.headers["content-type"].startswith("image/")
    n = requests.get(f"{BASE_URL}/api/notifications", headers=H(ctx["drv"])).json()
    items = n if isinstance(n, list) else n.get("items", n.get("notifications", []))
    assert any(x["title"] == "Profile photo approved" for x in items[:5])


def test_booking_photo_set_after_approve(ctx):
    if not ctx["booking"]:
        pytest.skip("no booking")
    b = requests.get(f"{BASE_URL}/api/bookings/{ctx['booking']}", headers=H(ctx["cus"])).json()
    assert b["driver"]["photo_url"] == f"/api/public/driver-photo/{ctx['ids']['p1']}"


# Replacement keeps old approved photo until new reviewed
def test_replace_keeps_old_visible(ctx):
    r = _upload(ctx["drv"], _img((10, 200, 10), "PNG"), "image/png", "p.png")
    assert r.status_code == 200 and r.json()["status"] == "PENDING"
    p2 = r.json()["id"]
    ctx["ids"]["p2"] = p2
    assert requests.get(f"{BASE_URL}/api/public/driver-photo/{ctx['ids']['p1']}").status_code == 200
    assert requests.get(f"{BASE_URL}/api/public/driver-photo/{p2}").status_code == 404
    if ctx["booking"]:
        b = requests.get(f"{BASE_URL}/api/bookings/{ctx['booking']}", headers=H(ctx["cus"])).json()
        assert b["driver"]["photo_url"] == f"/api/public/driver-photo/{ctx['ids']['p1']}"
    # driver can still fetch old one privately
    assert requests.get(f"{BASE_URL}/api/driver/photo/file/{ctx['ids']['p1']}", params={"token": ctx["drv"]}).status_code == 200


def test_reject_replacement_keeps_old(ctx):
    r = requests.post(f"{BASE_URL}/api/admin/drivers/{ctx['did']}/photo", headers=H(ctx["own"]), json={"approve": False, "reason": "TEST_cap"})
    assert r.status_code == 200
    if ctx["booking"]:
        b = requests.get(f"{BASE_URL}/api/bookings/{ctx['booking']}", headers=H(ctx["cus"])).json()
        assert b["driver"]["photo_url"] == f"/api/public/driver-photo/{ctx['ids']['p1']}"


def test_approve_replacement_switches(ctx):
    # upload a 3rd, approve -> photo_url switches, old p1 no longer public
    r = _upload(ctx["drv"], _img((10, 10, 200), "WEBP"), "image/webp", "p.webp")
    p3 = r.json()["id"]
    assert requests.post(f"{BASE_URL}/api/admin/drivers/{ctx['did']}/photo", headers=H(ctx["own"]), json={"approve": True}).status_code == 200
    assert requests.get(f"{BASE_URL}/api/public/driver-photo/{p3}").status_code == 200
    assert requests.get(f"{BASE_URL}/api/public/driver-photo/{ctx['ids']['p1']}").status_code == 404
    if ctx["booking"]:
        b = requests.get(f"{BASE_URL}/api/bookings/{ctx['booking']}", headers=H(ctx["cus"])).json()
        assert b["driver"]["photo_url"] == f"/api/public/driver-photo/{p3}"


def test_review_no_photo_404(ctx):
    other = DB.users.find_one({"phone": "+917000000002"}, {"_id": 0, "id": 1})
    if not other or DB.driver_profiles.find_one({"user_id": other["id"], "photo": {"$exists": True}}):
        pytest.skip("no photo-less driver")
    r = requests.post(f"{BASE_URL}/api/admin/drivers/{other['id']}/photo", headers=H(ctx["own"]), json={"approve": True})
    assert r.status_code == 404
