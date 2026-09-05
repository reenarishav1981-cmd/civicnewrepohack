from fastapi import APIRouter, HTTPException

from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
)
from app.schemas.duplicate import DuplicateRequest
from app.schemas.priority import PriorityRequest
from app.schemas.pipeline import (
    FullAnalysisRequest,
    FullPipelineResponse,
)
from app.services.analyzer import analyze_issue
from app.services.duplicate import find_duplicate
from app.services.priority import calculate_priority


router = APIRouter(
    prefix="/analyze",
    tags=["Complaint Intelligence"]
)


@router.post(
    "",
    response_model=AnalyzeResponse,
    summary="Analyze citizen complaint text and image",
)
def analyze_civic_issue(request: AnalyzeRequest):
    """
    Transforms unstructured civic complaint text into structured intelligence:
    category, severity (1-5), urgency, sensitive context, and explainable decision factors.
    """
    try:
        result, meta = analyze_issue(
            description=request.description,
            image_url=request.image_url,
        )
        return AnalyzeResponse(
            success=True,
            data=result,
            meta=meta,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Complaint analysis failed: {str(e)}"
        )


@router.post(
    "/full",
    response_model=FullPipelineResponse,
    summary="Execute full end-to-end intelligence pipeline",
)
def analyze_full_pipeline(request: FullAnalysisRequest):
    """
    Executes the entire CivicPulse AI Engine pipeline in one unified call:
    1. Multilingual Complaint Understanding & Categorization
    2. Multi-Signal Duplicate Incident Detection
    3. Dynamic Priority Scoring & Factor Attribution
    """
    import uuid, datetime
    req_id = f"AI-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.datetime.now().isoformat()

    print("\n================================================")
    print("AI ENGINE LIVE REQUEST")
    print("================================================")
    print(f"Timestamp: {timestamp}")
    print(f"Request ID: {req_id}")
    print("Endpoint: /analyze/full")
    print(f"Description:\n{request.description}")
    print(f"Coordinates: lat={request.latitude}, lon={request.longitude}")
    print(f"Candidate Incidents: {len(request.existing_incidents)}")
    print("================================================\n")

    try:
        # Step 1: Complaint Understanding
        analysis_result, analysis_meta = analyze_issue(
            description=request.description,
            image_url=request.image_url,
        )

        # Step 2: Duplicate Detection
        dup_req = DuplicateRequest(
            description=request.description,
            category=analysis_result.category,
            latitude=request.latitude,
            longitude=request.longitude,
            existing_incidents=request.existing_incidents,
        )
        duplicate_result, dup_meta = find_duplicate(dup_req)

        # Step 3: Priority Intelligence
        # If a duplicate is matched, duplicate_count is at least 1
        dup_count = 1 if duplicate_result.is_duplicate else 0
        priority_req = PriorityRequest(
            severity=analysis_result.severity,
            urgency=analysis_result.urgency,
            sensitive_location=analysis_result.context.sensitive_location,
            location_type=analysis_result.context.location_type,
            category=analysis_result.category,
            duplicate_count=dup_count,
            safety_risk=analysis_result.context.safety_risk,
            affected_population=analysis_result.context.affected_population,
            confidence=analysis_result.confidence,
        )
        priority_result, priority_meta = calculate_priority(priority_req)

        return FullPipelineResponse(
            success=True,
            complaint_analysis=analysis_result,
            duplicate=duplicate_result,
            priority=priority_result,
            meta=analysis_meta,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Full pipeline analysis failed: {str(e)}"
        )