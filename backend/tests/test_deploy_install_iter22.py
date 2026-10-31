# Deploy-readiness smoke: requirements sanity, local backend liveness, frontend lockfile presence
import os
import re
import requests

BACKEND_DIR = "/app/backend"
LOCAL = "http://localhost:8001"  # review request explicitly asks for local backend liveness


# Requirements: removed conflicting/unused pins must stay out
def test_requirements_has_no_conflicting_pins():
    txt = open(os.path.join(BACKEND_DIR, "requirements.txt")).read()
    assert "emergentintegrations" not in txt
    assert "litellm" not in txt
    for pkg in ["razorpay", "twilio", "PyJWT", "motor", "httpx", "requests", "boto3", "fastapi", "uvicorn"]:
        assert re.search(rf"^{pkg}==", txt, re.M | re.I), f"{pkg} missing"


# No backend source imports the removed packages
def test_no_backend_imports_removed_packages():
    for root, _, files in os.walk(BACKEND_DIR):
        if "tests" in root:
            continue
        for f in files:
            if f.endswith(".py"):
                src = open(os.path.join(root, f)).read()
                assert "emergentintegrations" not in src and "litellm" not in src, f


# Local backend liveness
def test_public_config_200():
    r = requests.get(f"{LOCAL}/api/public/config", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_otp_send_empty_body_422():
    r = requests.post(f"{LOCAL}/api/auth/otp/send", timeout=15)
    assert r.status_code == 422
    assert "detail" in r.json()


# Frontend lockfile exists
def test_frontend_yarn_lock_exists():
    p = "/app/frontend/yarn.lock"
    assert os.path.exists(p) and os.path.getsize(p) > 10000
