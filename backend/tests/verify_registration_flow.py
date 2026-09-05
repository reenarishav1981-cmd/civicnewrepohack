import urllib.request
import urllib.parse
import json
import uuid
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_cors_preflight(origin):
    print(f"\n--- Testing CORS preflight from origin: {origin} ---")
    req = urllib.request.Request(
        f"{BASE_URL}/auth/register",
        method="OPTIONS",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
    )
    with urllib.request.urlopen(req) as resp:
        print(f"Status: {resp.status}")
        allow_origin = resp.headers.get("Access-Control-Allow-Origin")
        allow_creds = resp.headers.get("Access-Control-Allow-Credentials")
        print(f"Access-Control-Allow-Origin: {allow_origin}")
        print(f"Access-Control-Allow-Credentials: {allow_creds}")
        assert allow_origin == origin or allow_origin == "*", f"Expected {origin} but got {allow_origin}"
        assert allow_creds == "true", "Credentials not allowed in CORS"
    print("CORS preflight PASSED.")

def test_citizen_registration_and_login():
    print("\n--- Testing Citizen Registration, Token Issuance, and /auth/me ---")
    unique_email = f"citizen_{uuid.uuid4().hex[:8]}@example.com"
    reg_payload = {
        "full_name": "Priya Sharma",
        "email": unique_email,
        "password": "Password123!",
        "phone": "+91-9876543210"
    }
    
    # 1. Register
    reg_data_bytes = json.dumps(reg_payload).encode("utf-8")
    reg_req = urllib.request.Request(
        f"{BASE_URL}/auth/register",
        data=reg_data_bytes,
        headers={"Content-Type": "application/json", "Origin": "http://localhost:3000"},
        method="POST"
    )
    with urllib.request.urlopen(reg_req) as resp:
        assert resp.status == 201, f"Expected 201 Created, got {resp.status}"
        reg_res = json.loads(resp.read().decode("utf-8"))
        print(f"Registered User Response: {reg_res}")
        assert reg_res["email"] == unique_email
        assert reg_res["role"] == "CITIZEN"
        assert "user_id" in reg_res
    print("Registration step PASSED.")

    # 2. Login
    login_payload = {
        "email": unique_email,
        "password": "Password123!"
    }
    login_req = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=json.dumps(login_payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Origin": "http://localhost:3000"},
        method="POST"
    )
    with urllib.request.urlopen(login_req) as resp:
        assert resp.status == 200, f"Expected 200 OK, got {resp.status}"
        login_res = json.loads(resp.read().decode("utf-8"))
        print(f"Login Response: token_type={login_res.get('token_type')}, role={login_res.get('user', {}).get('role') or login_res.get('role')}")
        token = login_res["access_token"]
        assert token, "Access token missing from login response"
    print("Login step PASSED.")

    # 3. /auth/me
    me_req = urllib.request.Request(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}", "Origin": "http://localhost:3000"},
        method="GET"
    )
    with urllib.request.urlopen(me_req) as resp:
        assert resp.status == 200, f"Expected 200 OK, got {resp.status}"
        me_res = json.loads(resp.read().decode("utf-8"))
        print(f"User Profile (/auth/me): {me_res}")
        assert me_res["email"] == unique_email
        assert me_res["role"] == "CITIZEN"
    print("Auth /me step PASSED.")

    # 4. Duplicate Registration check (Must return 400 Bad Request with clear message)
    print("\n--- Testing Duplicate Registration Prevention ---")
    try:
        dup_req = urllib.request.Request(
            f"{BASE_URL}/auth/register",
            data=reg_data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(dup_req)
        assert False, "Should have failed with 400"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400, got {e.code}"
        err_body = json.loads(e.read().decode("utf-8"))
        print(f"Duplicate Error Response: {err_body}")
        assert "already registered" in str(err_body).lower() or "exists" in str(err_body).lower()
    print("Duplicate registration prevention PASSED.")

if __name__ == "__main__":
    test_cors_preflight("http://localhost:3000")
    test_cors_preflight("http://127.0.0.1:3000")
    test_citizen_registration_and_login()
    print("\nALL AUTH REGISTRATION VERIFICATIONS PASSED SUCCESSFULLY!")
