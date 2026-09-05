# tests/test_ai_services.py
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.schemas.analysis import AnalyzeRequest
from app.schemas.duplicate import DuplicateRequest, ExistingIncident
from app.schemas.verification import VerifyRequest
from app.services.analyzer import analyze_issue
from app.services.duplicate import (
    find_duplicate,
    haversine_distance_meters,
    cosine_similarity,
)
from app.services.verifier import verify_resolution


def test_analyzer_rule_based_fallback():
    desc = "Bahut bada gaddha hai school ke samne accident ho sakta hai"
    result, meta = analyze_issue(desc)
    assert result.category == "pothole"
    assert result.severity >= 4
    assert result.context.sensitive_location is True
    assert result.context.location_type == "school"
    assert result.language == "hinglish"


def test_haversine_distance():
    # Delhi Connaught Place to India Gate (~2.3 km)
    cp_lat, cp_lon = 28.6315, 77.2167
    ig_lat, ig_lon = 28.6129, 77.2295
    dist = haversine_distance_meters(cp_lat, cp_lon, ig_lat, ig_lon)
    assert dist is not None
    assert 2000 <= dist <= 2600


def test_cosine_similarity():
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [1.0, 0.0, 0.0]
    vec3 = [0.0, 1.0, 0.0]
    assert cosine_similarity(vec1, vec2) == 1.0
    assert cosine_similarity(vec1, vec3) == 0.0


def test_duplicate_detection():
    req = DuplicateRequest(
        description="Huge pothole right outside DPS school gate",
        category="pothole",
        latitude=28.6315,
        longitude=77.2167,
        existing_incidents=[
            ExistingIncident(
                incident_id="INC-001",
                description="Huge pothole right outside DPS school gate",
                category="pothole",
                latitude=28.6316,
                longitude=77.2168,
            ),
            ExistingIncident(
                incident_id="INC-002",
                description="Streetlight not working on highway",
                category="streetlight",
                latitude=28.7000,
                longitude=77.3000,
            ),
        ]
    )
    res, meta = find_duplicate(req)
    assert res.is_duplicate is True
    assert res.matched_incident_id == "INC-001"
    assert res.similarity_score >= 0.70


def test_verifier_missing_images():
    req = VerifyRequest(
        before_image_url="",
        after_image_url="",
        category="pothole"
    )
    res, meta = verify_resolution(req)
    assert res.issue_resolved is False
    assert res.verification_status.value == "insufficient_evidence"
