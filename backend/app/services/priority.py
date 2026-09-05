import time
from typing import Tuple, List
from app.schemas.common import AIModelMeta, PriorityLevel
from app.schemas.priority import (
    ContributingFactors,
    PriorityRequest,
    PriorityResult,
)


def calculate_priority(
    request: PriorityRequest,
) -> Tuple[PriorityResult, AIModelMeta]:
    """
    Computes transparent, explainable civic priority score (0-100)
    combining severity, urgency, sensitive location, public safety risk,
    and report concentration.
    """
    start_time = time.time()
    explanations: List[str] = []

    # 1. Base Severity Score (0 - 30 pts)
    base_severity_pts = round((request.severity / 5.0) * 30.0, 1)
    explanations.append(f"Base severity rating of {request.severity}/5 contributed {base_severity_pts}/30 points.")

    # 2. Urgency Boost (0 - 15 pts)
    urgency_map = {
        "immediate": 15.0,
        "high": 10.0,
        "medium": 5.0,
        "low": 0.0,
    }
    urgency_key = (request.urgency or "medium").lower()
    urgency_pts = urgency_map.get(urgency_key, 5.0)
    if urgency_pts > 0:
        explanations.append(f"Urgency tier '{urgency_key}' added {urgency_pts} points.")

    # 3. Sensitive Location Boost (0 - 20 pts)
    sensitive_pts = 0.0
    if request.sensitive_location:
        loc = (request.location_type or "").lower()
        if loc in ["school", "hospital"]:
            sensitive_pts = 20.0
            explanations.append(f"Critical proximity to {loc.upper()} added maximum context boost of 20 points.")
        elif loc in ["highway", "transit", "market"]:
            sensitive_pts = 14.0
            explanations.append(f"High-traffic context ({loc}) added 14 points.")
        else:
            sensitive_pts = 10.0
            explanations.append("Sensitive municipal zone added 10 points.")

    # 4. Public Safety Risk Boost (0 - 20 pts)
    safety_pts = 0.0
    if request.safety_risk:
        risk_lower = request.safety_risk.lower()
        if any(w in risk_lower for w in ["fatal", "lethal", "explosion", "electrocution", "death", "collapse", "severe injury", "life"]):
            safety_pts = 20.0
            explanations.append("Lethal/catastrophic public safety risk added 20 points.")
        elif any(w in risk_lower for w in ["accident", "injury", "vehicle damage", "skid"]):
            safety_pts = 14.0
            explanations.append("High collision/pedestrian accident risk added 14 points.")
        else:
            safety_pts = 8.0
            explanations.append("Identified safety hazard added 8 points.")

    # 5. Duplicate / Citizen Report Concentration (0 - 15 pts)
    duplicate_pts = 0.0
    if request.duplicate_count > 0:
        duplicate_pts = min(round(request.duplicate_count * 3.0, 1), 15.0)
        explanations.append(
            f"Volume of reports ({request.duplicate_count} citizen reports) boosted priority by {duplicate_pts} points."
        )

    # Calculate Total Score
    total_score = int(min(100, round(
        base_severity_pts + urgency_pts + sensitive_pts + safety_pts + duplicate_pts
    )))

    # Determine Priority Level
    if total_score >= 80:
        priority_level = PriorityLevel.CRITICAL
    elif total_score >= 60:
        priority_level = PriorityLevel.HIGH
    elif total_score >= 40:
        priority_level = PriorityLevel.MEDIUM
    else:
        priority_level = PriorityLevel.LOW

    contributing = ContributingFactors(
        base_severity_score=base_severity_pts,
        urgency_boost=urgency_pts,
        sensitive_location_boost=sensitive_pts,
        safety_risk_boost=safety_pts,
        duplicate_density_boost=duplicate_pts,
    )

    exec_ms = round((time.time() - start_time) * 1000, 2)
    meta = AIModelMeta(
        provider="civicpulse-intelligence",
        model="dynamic-priority-v2",
        confidence=request.confidence,
        fallback=False,
        execution_time_ms=exec_ms,
    )

    result = PriorityResult(
        priority_score=total_score,
        priority_level=priority_level,
        explanation=explanations,
        contributing_factors=contributing,
    )

    return result, meta
