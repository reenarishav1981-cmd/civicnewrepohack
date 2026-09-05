from typing import Tuple
from app.schemas.common import AIModelMeta, VerificationStatus
from app.schemas.verification import (
    VerificationResult,
    VerifyRequest,
)
from app.services.ai_client import fetch_image_bytes
from app.services.ai_provider import get_ai_provider


def verify_resolution(
    request: VerifyRequest,
) -> Tuple[VerificationResult, AIModelMeta]:
    """
    Performs visual verification comparing before and after evidence.
    Guarantees authentic computer vision inspection without fake responses.
    """
    if not request.before_image_url or not request.after_image_url:
        meta = AIModelMeta(
            provider="civicpulse-verifier",
            model="integrity-check",
            confidence=0.0,
            fallback=True,
            execution_time_ms=0.5,
        )
        result = VerificationResult(
            verification_status=VerificationStatus.INSUFFICIENT_EVIDENCE,
            confidence=0.0,
            issue_resolved=False,
            explanation="One or both required evidence image URLs are missing.",
            detected_changes=[],
            recommendation="Submit valid before and after photographic evidence to initiate verification."
        )
        return result, meta

    # Retrieve images
    before_data = fetch_image_bytes(request.before_image_url)
    after_data = fetch_image_bytes(request.after_image_url)

    if not before_data or not after_data:
        meta = AIModelMeta(
            provider="civicpulse-verifier",
            model="network-fetcher",
            confidence=0.0,
            fallback=True,
            execution_time_ms=1.0,
        )
        result = VerificationResult(
            verification_status=VerificationStatus.INSUFFICIENT_EVIDENCE,
            confidence=0.0,
            issue_resolved=False,
            explanation="Could not download or verify one or both image URLs.",
            detected_changes=[],
            recommendation="Ensure both image URLs are publicly reachable and valid image formats."
        )
        return result, meta

    before_bytes, before_mime = before_data
    after_bytes, after_mime = after_data

    provider = get_ai_provider()
    result, meta = provider.verify_resolution(
        before_bytes=before_bytes,
        after_bytes=after_bytes,
        before_mime=before_mime,
        after_mime=after_mime,
        category=request.category,
        description=request.description,
    )

    return result, meta