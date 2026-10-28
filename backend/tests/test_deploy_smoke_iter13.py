# Deployment-readiness smoke tests (iteration 13): public config + demo OTP auth + role homes
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', os.environ.get('EXPO_BACKEND_URL', '')).rstrip('/')
OTP = "123456"


@pytest.fixture(scope="module")
def s():
    if not BASE_URL:
        pytest.skip("backend URL env not set")
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _login(s, phone):
    r = s.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": phone, "code": OTP})
    assert r.status_code == 200, r.text
    d = r.json()
    assert "token" in d and "user" in d
    return d


# Public config
def test_public_config(s):
    r = s.get(f"{BASE_URL}/api/public/config")
    assert r.status_code == 200
    d = r.json()
    assert d["settings"]["company_name"] == "Prajeta"


# OTP send for demo phone
def test_otp_send_demo(s):
    r = s.post(f"{BASE_URL}/api/auth/otp/send", json={"phone": "9000000003"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["channel"] == "demo"
    assert d["phone"] == "+919000000003"


def test_otp_wrong_code(s):
    r = s.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": "9000000003", "code": "000000"})
    assert r.status_code == 400


@pytest.mark.parametrize("phone,role", [("9000000003", "customer"), ("9000000002", "driver"), ("9000000001", "owner")])
def test_demo_login_roles(s, phone, role):
    d = _login(s, phone)
    assert d["user"]["role"] == role
    assert "_id" not in d["user"]
    me = s.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {d['token']}"})
    assert me.status_code == 200
    assert me.json().get("role", me.json().get("user", {}).get("role")) == role
