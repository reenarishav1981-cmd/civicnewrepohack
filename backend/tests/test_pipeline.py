import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "ai_engine" in data


def test_analyze_endpoint():
    payload = {
        "description": "Dangerous open manhole on Main Street near Metro gate",
        "latitude": 28.6139,
        "longitude": 77.2090,
    }
    res = client.post("/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "data" in data
    assert "meta" in data
    assert data["data"]["category"] in ["sewage", "drainage", "public_safety"]


def test_malformed_input_returns_422():
    # Description shorter than 3 characters
    payload = {"description": "ab"}
    res = client.post("/analyze", json=payload)
    assert res.status_code == 422


def test_duplicate_endpoint():
    payload = {
        "description": "Massive pothole outside Delhi Public School",
        "category": "pothole",
        "latitude": 28.6315,
        "longitude": 77.2167,
        "existing_incidents": [
            {
                "incident_id": "INC-888",
                "description": "Huge crater on road near DPS school gate",
                "category": "pothole",
                "latitude": 28.6316,
                "longitude": 77.2168,
            }
        ]
    }
    res = client.post("/duplicate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["is_duplicate"] is True
    assert data["data"]["matched_incident_id"] == "INC-888"


def test_priority_endpoint():
    payload = {
        "severity": 4,
        "urgency": "immediate",
        "sensitive_location": True,
        "location_type": "hospital",
        "safety_risk": "Ambulance passage blocked",
        "duplicate_count": 8,
    }
    res = client.post("/priority", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["priority_score"] >= 80
    assert data["data"]["priority_level"] == "critical"


def test_full_pipeline_endpoint():
    payload = {
        "description": "Hospital gate ke saamne road dhas gayi hai aur bada gaddha ho gaya hai",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "existing_incidents": [
            {
                "incident_id": "INC-999",
                "description": "Road collapsed in front of hospital main gate",
                "category": "road_damage",
                "latitude": 28.6140,
                "longitude": 77.2091,
            }
        ]
    }
    res = client.post("/analyze/full", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "complaint_analysis" in data
    assert "duplicate" in data
    assert "priority" in data
    assert "meta" in data
    assert data["complaint_analysis"]["context"]["sensitive_location"] is True
    assert data["duplicate"]["is_duplicate"] is True
    assert data["priority"]["priority_score"] >= 60
