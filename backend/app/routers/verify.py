from fastapi import APIRouter, HTTPException
from app.schemas.verification import (
    VerifyRequest,
    VerifyResponse,
)
from app.services.verifier import verify_resolution


router = APIRouter(
    prefix="/verify",
    tags=["Resolution Verification"]
)


@router.post(
    "",
    response_model=VerifyResponse,
    summary="Verify resolution through before/after visual evidence",
)
def verify_issue_resolution(request: VerifyRequest):
    """
    Compares before and after images using computer vision to determine
    if a civic issue was resolved or if fraud is suspected.
    """
    try:
        result, meta = verify_resolution(request)
        return VerifyResponse(
            success=True,
            data=result,
            meta=meta,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resolution verification failed: {str(e)}"
        )