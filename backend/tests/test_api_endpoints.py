import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert "service" in res.json()

    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_analyze_endpoint():
    payload = {
        "description": "Road hole and gaddha near hospital gate",
        "latitude": 28.6139,
        "longitude": 77.2090
    }
    res = client.post("/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["category"] == "pothole"
    assert data["data"]["context"]["sensitive_location"] is True
    assert data["data"]["context"]["location_type"] == "hospital"

def test_duplicate_endpoint():
    payload = {
        "description": "Massive pothole in front of main hospital",
        "category": "pothole",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "existing_incidents": [
            {
                "incident_id": "INC-099",
                "description": "Massive pothole in front of main hospital",
                "category": "pothole",
                "latitude": 28.6140,
                "longitude": 77.2091
            }
        ]
    }
    res = client.post("/duplicate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["is_duplicate"] is True
    assert data["data"]["matched_incident_id"] == "INC-099"

def test_verify_endpoint():
    payload = {
        "before_image_url": "https://example.com/pothole_before.jpg",
        "after_image_url": "https://example.com/pothole_after.jpg",
        "category": "pothole"
    }
    res = client.post("/verify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert data["data"]["verification_status"] in (
        "pending_ai_verification",
        "insufficient_evidence",
        "manual_review_required",
        "verified_resolved",
        "not_resolved",
    )
