import pytest
from app.schemas.priority import PriorityRequest
from app.schemas.common import PriorityLevel
from app.services.priority import calculate_priority


def test_high_priority_school_pothole_with_multiple_reports():
    # Pothole + school + high accident risk + 10 duplicate reports
    req = PriorityRequest(
        severity=4,
        urgency="high",
        sensitive_location=True,
        location_type="school",
        category="pothole",
        duplicate_count=10,
        safety_risk="Severe risk of child injury and van overturning",
        affected_population="schoolchildren and teachers",
    )
    result, meta = calculate_priority(req)
    assert result.priority_score >= 80
    assert result.priority_level == PriorityLevel.CRITICAL
    assert len(result.explanation) >= 4
    assert result.contributing_factors.sensitive_location_boost == 20.0
    assert result.contributing_factors.duplicate_density_boost >= 15.0


def test_low_priority_cosmetic_issue():
    # Minor issue in quiet residential area with no duplicates
    req = PriorityRequest(
        severity=1,
        urgency="low",
        sensitive_location=False,
        location_type=None,
        category="other",
        duplicate_count=0,
        safety_risk=None,
    )
    result, meta = calculate_priority(req)
    assert result.priority_score <= 35
    assert result.priority_level == PriorityLevel.LOW
    assert result.contributing_factors.sensitive_location_boost == 0.0


def test_severity_alone_does_not_equal_priority():
    # Both have severity=3, but one is in a hospital zone with 5 duplicates
    regular_issue = PriorityRequest(
        severity=3,
        urgency="medium",
        sensitive_location=False,
        duplicate_count=0,
    )
    critical_context_issue = PriorityRequest(
        severity=3,
        urgency="high",
        sensitive_location=True,
        location_type="hospital",
        safety_risk="Ambulance ingress blocked",
        duplicate_count=5,
    )

    score1, _ = calculate_priority(regular_issue)
    score2, _ = calculate_priority(critical_context_issue)

    assert score2.priority_score > score1.priority_score + 30
