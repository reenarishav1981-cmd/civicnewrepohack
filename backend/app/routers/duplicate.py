from fastapi import APIRouter, HTTPException
from app.schemas.duplicate import (
    DuplicateRequest,
    DuplicateResponse,
)
from app.services.duplicate import find_duplicate


router = APIRouter(
    prefix="/duplicate",
    tags=["Duplicate Detection"]
)


@router.post(
    "",
    response_model=DuplicateResponse,
    summary="Multi-signal duplicate civic complaint detection",
)
def check_duplicate(request: DuplicateRequest):
    """
    Evaluates whether a new complaint duplicates existing incidents using
    semantic vector embeddings, category matching, and Haversine distance.
    """
    try:
        result, meta = find_duplicate(request)
        return DuplicateResponse(
            success=True,
            data=result,
            meta=meta,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Duplicate detection failed: {str(e)}"
        )