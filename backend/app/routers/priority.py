from fastapi import APIRouter, HTTPException
from app.schemas.priority import (
    PriorityRequest,
    PriorityResponse,
)
from app.services.priority import calculate_priority


router = APIRouter(
    prefix="/priority",
    tags=["Priority Intelligence"]
)


@router.post(
    "",
    response_model=PriorityResponse,
    summary="Compute multi-factor civic priority score (0-100)",
)
def compute_priority(request: PriorityRequest):
    """
    Calculates transparent priority score (0-100) and priority level
    based on severity, urgency, sensitive context, hazards, and report volume.
    """
    try:
        result, meta = calculate_priority(request)
        return PriorityResponse(
            success=True,
            data=result,
            meta=meta,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Priority calculation failed: {str(e)}"
        )
