import pytest
from app.schemas.verification import VerifyRequest
from app.schemas.common import VerificationStatus
from app.services.verifier import verify_resolution


def test_missing_image_urls():
    req = VerifyRequest(
        before_image_url="",
        after_image_url="",
        category="pothole",
    )
    result, meta = verify_resolution(req)
    assert result.verification_status == VerificationStatus.INSUFFICIENT_EVIDENCE
    assert result.issue_resolved is False
    assert result.confidence == 0.0


def test_unreachable_images():
    req = VerifyRequest(
        before_image_url="http://invalid-domain-that-does-not-exist-99.org/before.jpg",
        after_image_url="http://invalid-domain-that-does-not-exist-99.org/after.jpg",
        category="pothole",
    )
    result, meta = verify_resolution(req)
    assert result.verification_status == VerificationStatus.INSUFFICIENT_EVIDENCE
    assert result.issue_resolved is False
