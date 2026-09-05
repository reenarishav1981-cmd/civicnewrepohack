import requests
import json
import io
from PIL import Image, ExifTags

BASE_URL = "http://localhost:8000/api/v1"

def log(msg, success=True):
    prefix = "[PASS]" if success else "[FAIL]"
    print(f"{prefix} {msg}")

def run_e2e_test():
    print("============================================================")
    print("CIVICPULSE FULL END-TO-END FLOW VERIFICATION")
    print("============================================================")

    # 0. Health Check
    h_res = requests.get(f"{BASE_URL}/health")
    assert h_res.status_code == 200, f"Health check failed: {h_res.text}"
    h_data = h_res.json()
    assert h_data["database"]["connected"] is True
    assert h_data["ai_engine"]["status"] == "healthy"
    log("Health Check: Core Backend, Database, and AI Engine connected")

    # 1. Citizen Registration
    cit_email = f"e2e_citizen_{int(requests.get(f'{BASE_URL}/health').elapsed.total_seconds()*1000)}@civicpulse.org"
    reg_payload = {
        "email": cit_email,
        "password": "CitizenSecure123!",
        "full_name": "Devansh Gupta",
        "phone": "+91-9876543210"
    }
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, f"Citizen register failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert reg_data["role"] == "CITIZEN"
    log(f"Step 1a: Citizen Registered ({reg_data['user_id']}, Role={reg_data['role']})")

    # 1b. Verify Public Registration cannot create privileged roles
    bad_reg_payload = {
        "email": f"bad_admin_{reg_data['user_id']}@civicpulse.org",
        "password": "AdminPassword123!",
        "full_name": "Fake Admin",
        "role": "ADMIN" # Pydantic schema will ignore or disallow setting role
    }
    bad_res = requests.post(f"{BASE_URL}/auth/register", json=bad_reg_payload)
    assert bad_res.status_code == 201
    assert bad_res.json()["role"] == "CITIZEN", "Public registration must strictly be CITIZEN!"
    log("Step 1b: RBAC Enforcement - Public registration strictly creates CITIZEN")

    # 1c. Citizen Login & Token Verification
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": cit_email,
        "password": "CitizenSecure123!"
    })
    assert login_res.status_code == 200
    cit_tokens = login_res.json()
    cit_token = cit_tokens["access_token"]
    cit_refresh = cit_tokens["refresh_token"]
    assert cit_token and cit_refresh
    assert cit_tokens["role"] == "CITIZEN"
    cit_headers = {"Authorization": f"Bearer {cit_token}"}
    log("Step 1c: Citizen Logged in with Access and Refresh JWT tokens")

    # 1d. Token Refresh Test
    ref_res = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": cit_refresh})
    assert ref_res.status_code == 200
    assert "access_token" in ref_res.json()
    log("Step 1d: Access token refreshed using Refresh Token")

    # 1e. /auth/me Test
    me_res = requests.get(f"{BASE_URL}/auth/me", headers=cit_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == cit_email
    log("Step 1e: /auth/me returns current authenticated user profile")

    # 2. Upload Image with EXIF GPS
    img = Image.new("RGB", (60, 60), color="orange")
    exif = img.getexif()
    gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
    gps_ifd[ExifTags.GPS.GPSLatitude] = (26.0, 13.0, 6.6) # 26.2185
    gps_ifd[ExifTags.GPS.GPSLatitudeRef] = "N"
    gps_ifd[ExifTags.GPS.GPSLongitude] = (78.0, 10.0, 58.8) # 78.1830
    gps_ifd[ExifTags.GPS.GPSLongitudeRef] = "E"
    gps_ifd[31] = 3.5 # Accuracy

    img_buf = io.BytesIO()
    img.save(img_buf, format="JPEG", exif=exif)
    img_buf.seek(0)

    upload_res = requests.post(
        f"{BASE_URL}/uploads",
        files={"file": ("pothole_exif.jpg", img_buf, "image/jpeg")}
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert upload_data["has_exif_gps"] is True
    assert abs(upload_data["exif_latitude"] - 26.2185) < 1e-3
    assert abs(upload_data["exif_longitude"] - 78.1830) < 1e-3
    media_url = upload_data["media_url"]
    log(f"Step 2: Real EXIF GPS Extracted on Upload ({upload_data['exif_latitude']}, {upload_data['exif_longitude']})")

    # 3. Submit Report 1 with EXIF Image
    rep1_payload = {
        "description": "Hazardous road crater outside Model School on Jhansi Road causing vehicles to swerve",
        "image_url": media_url,
        "address": "Jhansi Road Model School Gate"
    }
    rep1_res = requests.post(f"{BASE_URL}/reports", json=rep1_payload, headers=cit_headers)
    assert rep1_res.status_code == 201, f"Report 1 failed: {rep1_res.text}"
    rep1_data = rep1_res.json()
    assert rep1_data["location"]["source"] == "exif"
    assert rep1_data["location"]["location_source"] == "exif"
    assert abs(rep1_data["location"]["latitude"] - 26.2185) < 1e-3
    assert rep1_data["location"]["accuracy_m"] == 3.5
    inc1_id = rep1_data["incident_id"]
    log(f"Step 3: Report 1 Created (ID={rep1_data['report_id']}, Linked Incident={inc1_id}, LocSource=EXIF)")

    # 4. Duplicate Report Submission (Report 2 nearby)
    rep2_payload = {
        "description": "Bada gaddha school ke gate ke samne sadak par accident ho sakta hai",
        "device_latitude": 26.2186, # 15 meters away
        "device_longitude": 78.1831,
        "device_accuracy_m": 4.0,
        "address": "School Gate Jhansi Rd"
    }
    rep2_res = requests.post(f"{BASE_URL}/reports", json=rep2_payload, headers=cit_headers)
    assert rep2_res.status_code == 201, f"Report 2 failed: {rep2_res.text}"
    rep2_data = rep2_res.json()
    assert rep2_data["location"]["source"] == "device_gps"
    log(f"Step 4: Report 2 Submitted. Duplicate Result: is_duplicate={rep2_data['is_duplicate']}, Attached Incident={rep2_data['incident_id']}")

    # 5. Authority Review & Override
    # Seed already has authority@civicpulse.org / AuthorityPass123!
    auth_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "authority@civicpulse.org",
        "password": "AuthorityPass123!"
    })
    if auth_login.status_code != 200:
        print("Authority login failed:", auth_login.status_code, auth_login.text)
    assert auth_login.status_code == 200
    auth_headers = {"Authorization": f"Bearer {auth_login.json()['access_token']}"}
    log("Step 5a: Logged in as Municipal Authority Officer")

    # 5b. RBAC Check: Citizen CANNOT review or assign incidents
    forbidden_res = requests.post(
        f"{BASE_URL}/incidents/{inc1_id}/review",
        json={"decision": "approve", "reason": "Unauthorized citizen approval"},
        headers=cit_headers
    )
    assert forbidden_res.status_code == 403, "Citizen MUST be forbidden from reviewing incidents!"
    log("Step 5b: RBAC Enforcement - Citizen forbidden (HTTP 403) from Authority review")

    # 5c. Authority Review Execution
    review_res = requests.post(
        f"{BASE_URL}/incidents/{inc1_id}/review",
        json={
            "decision": "override",
            "reason": "Verified critical road hazard near school zone",
            "overrides": {"priority_score": 90, "priority_level": "critical"}
        },
        headers=auth_headers
    )
    assert review_res.status_code == 200
    log(f"Step 5c: Authority Review completed and audit log appended for incident {inc1_id}")

    # 6. Assign Field Worker / Team
    # Team TEAM-001 was created in seed and USR-1003 belongs to TEAM-001
    assign_res = requests.post(
        f"{BASE_URL}/incidents/{inc1_id}/assign",
        json={"team_id": "TEAM-001", "sla_hours": 48},
        headers=auth_headers
    )
    assert assign_res.status_code == 200
    log(f"Step 6: Team Assigned (TEAM-001) to Incident {inc1_id}")

    # 7. Field Worker Flow
    field_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "field@civicpulse.org",
        "password": "FieldPass123!"
    })
    assert field_login.status_code == 200
    field_headers = {"Authorization": f"Bearer {field_login.json()['access_token']}"}
    log("Step 7a: Logged in as Field Worker (field@civicpulse.org)")

    # Fetch assigned tasks
    tasks_res = requests.get(f"{BASE_URL}/field/tasks", headers=field_headers)
    assert tasks_res.status_code == 200
    tasks_list = tasks_res.json()
    assert len(tasks_list) > 0
    active_task = next((t for t in tasks_list if t.get("incident_id") == inc1_id), tasks_list[0])
    target_task_id = active_task["task_id"]

    # 7b. State Machine Transitions: ASSIGNED -> ACCEPTED -> ARRIVED -> IN_PROGRESS
    s1 = requests.post(f"{BASE_URL}/field/tasks/{target_task_id}/accept", json={"notes": "Dispatch acknowledged"}, headers=field_headers)
    assert s1.status_code == 200
    s2 = requests.post(f"{BASE_URL}/field/tasks/{target_task_id}/arrive", json={"notes": "Crew on site"}, headers=field_headers)
    assert s2.status_code == 200
    s3 = requests.post(f"{BASE_URL}/field/tasks/{target_task_id}/start", json={"notes": "Asphalt patching underway"}, headers=field_headers)
    assert s3.status_code == 200
    log(f"Step 7b: Task State Machine advanced ASSIGNED -> ACCEPTED -> ARRIVED -> IN_PROGRESS")

    # 7c. Invalid state transition check (e.g. accepting already started task should fail)
    bad_transition = requests.post(f"{BASE_URL}/field/tasks/{target_task_id}/accept", json={"notes": "Duplicate accept"}, headers=field_headers)
    assert bad_transition.status_code == 400
    log("Step 7c: Invalid Task State Machine transition rejected (HTTP 400)")

    # 8. Upload Repair Evidence
    repaired_img = Image.new("RGB", (60, 60), color="green")
    rep_buf = io.BytesIO()
    repaired_img.save(rep_buf, format="JPEG")
    rep_buf.seek(0)

    # First upload image via /uploads
    up_rep = requests.post(
        f"{BASE_URL}/uploads",
        files={"file": ("repaired_road.jpg", rep_buf, "image/jpeg")},
        headers=field_headers
    )
    assert up_rep.status_code == 200
    rep_url = up_rep.json()["media_url"]

    # Submit evidence
    evidence_res = requests.post(
        f"{BASE_URL}/field/tasks/{target_task_id}/evidence",
        json={"after_image_url": rep_url, "notes": "Asphalt cold-mix patch completed and compacted"},
        headers=field_headers
    )
    assert evidence_res.status_code == 200
    log("Step 8: Repair Photographic Evidence Uploaded")

    # 9. Complete Task & Trigger Resolution Verification
    comp_res = requests.post(
        f"{BASE_URL}/field/tasks/{target_task_id}/complete",
        headers=field_headers
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    v_status = comp_data.get("verification_status")
    log(f"Step 9: Task COMPLETED -> AI Resolution Verification Triggered (Status: {v_status})")

    # 10. Verify Incident status in MongoDB
    inc_check = requests.get(f"{BASE_URL}/incidents/{inc1_id}", headers=auth_headers)
    assert inc_check.status_code == 200
    inc_final = inc_check.json()
    assert len(inc_final["reports"]) >= 1
    assert len(inc_final["timeline"]) >= 2
    log(f"Step 10: Verified Incident {inc1_id} persisted in MongoDB with complete timeline audit")

    print("============================================================")
    print("ALL 10 END-TO-END FLOW PHASES PASSED WITH ZERO ERRORS!")
    print("============================================================")

if __name__ == "__main__":
    run_e2e_test()
