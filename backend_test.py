#!/usr/bin/env python3
"""Backend test suite for production deploy crash fix verification."""
import sys
import subprocess
import requests
import json

# Test against LOCAL backend
BASE_URL = "http://localhost:8001"

def test_health():
    """Test 1: GET /health returns 200 {"status":"ok"}"""
    print("\n=== Test 1: Health Check ===")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("status") == "ok":
            print("✅ PASS: Health check successful")
            return True
        else:
            print("❌ FAIL: Health check failed")
            return False
    except Exception as e:
        print(f"❌ FAIL: Health check error: {e}")
        return False


def test_import_without_razorpay():
    """Test 2: Server imports without razorpay module (simulate deploy environment)"""
    print("\n=== Test 2: Import Without Razorpay Module ===")
    try:
        # Test that server.py can be imported even when razorpay is blocked
        cmd = [
            "/root/.venv/bin/python",
            "-c",
            "import sys; sys.modules['razorpay']=None; import server; print('Import successful')"
        ]
        result = subprocess.run(
            cmd,
            cwd="/app/backend",
            capture_output=True,
            text=True,
            timeout=10
        )
        
        print(f"Return Code: {result.returncode}")
        print(f"Stdout: {result.stdout}")
        if result.stderr:
            print(f"Stderr: {result.stderr}")
        
        if result.returncode == 0 and "Import successful" in result.stdout:
            print("✅ PASS: Server imports successfully without razorpay module")
            return True
        else:
            print("❌ FAIL: Server failed to import without razorpay module")
            return False
    except Exception as e:
        print(f"❌ FAIL: Import test error: {e}")
        return False


def test_public_config():
    """Test 3a: GET /api/public/config returns 200"""
    print("\n=== Test 3a: Public Config ===")
    try:
        response = requests.get(f"{BASE_URL}/api/public/config", timeout=5)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        
        if response.status_code == 200 and "settings" in data:
            print("✅ PASS: Public config endpoint working")
            return True
        else:
            print("❌ FAIL: Public config endpoint failed")
            return False
    except Exception as e:
        print(f"❌ FAIL: Public config error: {e}")
        return False


def test_auth_flow():
    """Test 3b-3c: Complete auth flow with demo credentials"""
    print("\n=== Test 3b: OTP Send ===")
    phone = "+919000000002"
    
    # Step 1: Send OTP
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/otp/send",
            json={"phone": phone},
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code != 200:
            print("❌ FAIL: OTP send failed")
            return False
        
        print("✅ PASS: OTP send successful")
    except Exception as e:
        print(f"❌ FAIL: OTP send error: {e}")
        return False
    
    # Step 2: Verify OTP
    print("\n=== Test 3c: OTP Verify ===")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/otp/verify",
            json={
                "phone": phone,
                "code": "123456",
                "role": "driver"
            },
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        
        if response.status_code != 200 or "token" not in data:
            print("❌ FAIL: OTP verify failed")
            return False
        
        token = data["token"]
        print(f"Token received: {token[:20]}...")
        print("✅ PASS: OTP verify successful")
        
        # Step 3: Get current user with token
        print("\n=== Test 3d: Auth Me ===")
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        user_data = response.json()
        print(f"User: {user_data.get('phone')} - {user_data.get('role')}")
        
        if response.status_code == 200 and user_data.get("phone") == phone:
            print("✅ PASS: Auth me endpoint working")
            return True
        else:
            print("❌ FAIL: Auth me endpoint failed")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Auth flow error: {e}")
        return False


def test_no_toplevel_import():
    """Test 4: Confirm no top-level 'import razorpay' in server.py"""
    print("\n=== Test 4: No Top-Level Import ===")
    try:
        result = subprocess.run(
            ["grep", "-n", "^import razorpay", "/app/backend/server.py"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:  # grep returns non-zero when no match found
            print("✅ PASS: No top-level 'import razorpay' found in server.py")
            return True
        else:
            print(f"❌ FAIL: Found top-level 'import razorpay' at:")
            print(result.stdout)
            return False
    except Exception as e:
        print(f"❌ FAIL: Grep test error: {e}")
        return False


def test_razorpay_in_requirements():
    """Test 4b: Confirm razorpay is in requirements.txt"""
    print("\n=== Test 4b: Razorpay in Requirements ===")
    try:
        with open("/app/backend/requirements.txt", "r") as f:
            content = f.read()
            if "razorpay" in content:
                print("✅ PASS: razorpay found in requirements.txt")
                return True
            else:
                print("❌ FAIL: razorpay not found in requirements.txt")
                return False
    except Exception as e:
        print(f"❌ FAIL: Requirements check error: {e}")
        return False


def main():
    """Run all tests and report results"""
    print("=" * 60)
    print("BACKEND DEPLOY CRASH FIX VERIFICATION")
    print("Testing against LOCAL backend: http://localhost:8001")
    print("=" * 60)
    
    results = {
        "Health Check": test_health(),
        "Import Without Razorpay": test_import_without_razorpay(),
        "Public Config": test_public_config(),
        "Auth Flow (OTP Send/Verify/Me)": test_auth_flow(),
        "No Top-Level Import": test_no_toplevel_import(),
        "Razorpay in Requirements": test_razorpay_in_requirements(),
    }
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Deploy crash fix verified!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
