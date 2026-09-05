import pytest
from app.schemas.duplicate import DuplicateRequest, ExistingIncident
from app.services.duplicate import (
    find_duplicate,
    haversine_distance_meters,
)


def test_duplicate_detected_with_proximity():
    req = DuplicateRequest(
        description="School ke saamne bahut bada gaddha hai",
        category="pothole",
        latitude=28.6315,
        longitude=77.2167,
        existing_incidents=[
            ExistingIncident(
                incident_id="INC-201",
                description="Large pothole on road right in front of school gate",
                category="pothole",
                latitude=28.6316,
                longitude=77.2168,
            )
        ]
    )
    result, meta = find_duplicate(req)
    assert result.is_duplicate is True
    assert result.matched_incident_id == "INC-201"
    assert result.similarity_score >= 0.70
    assert result.signals_used.distance_meters is not None
    assert result.signals_used.distance_meters < 50


def test_non_duplicate_different_issue():
    req = DuplicateRequest(
        description="Street light pole broken and completely dark at night",
        category="streetlight",
        latitude=28.6315,
        longitude=77.2167,
        existing_incidents=[
            ExistingIncident(
                incident_id="INC-301",
                description="Sewage overflow and bad odor near market",
                category="sewage",
                latitude=28.6315,
                longitude=77.2167,
            )
        ]
    )
    result, meta = find_duplicate(req)
    assert result.is_duplicate is False
    assert result.matched_incident_id is None


def test_duplicate_missing_coordinates():
    # When coordinates are not provided, duplicate should still work via semantic text similarity
    req = DuplicateRequest(
        description="Huge pothole right outside DPS school gate",
        category="pothole",
        latitude=None,
        longitude=None,
        existing_incidents=[
            ExistingIncident(
                incident_id="INC-401",
                description="Huge pothole right outside DPS school gate",
                category="pothole",
                latitude=None,
                longitude=None,
            )
        ]
    )
    result, meta = find_duplicate(req)
    assert result.is_duplicate is True
    assert result.matched_incident_id == "INC-401"
    assert result.signals_used.distance_meters is None


def test_haversine_formula_precision():
    # Connaught Place to India Gate (~2.3 km)
    dist = haversine_distance_meters(28.6315, 77.2167, 28.6129, 77.2295)
    assert dist is not None
    assert 2100 <= dist <= 2500

    # Same location
    dist_zero = haversine_distance_meters(28.6315, 77.2167, 28.6315, 77.2167)
    assert dist_zero == 0.0

    # Missing coordinates
    assert haversine_distance_meters(None, 77.2167, 28.6129, 77.2295) is None
