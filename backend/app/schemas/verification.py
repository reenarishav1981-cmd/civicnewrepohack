from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import AIModelMeta, VerificationStatus


class VerificationResult(BaseModel):
    """
    Structured outcome of computer vision resolution verification.
    """
    verification_status: VerificationStatus = Field(
        ...,
        description="Outcome: 'verified_resolved', 'partially_resolved', 'not_resolved', 'insufficient_evidence', or 'manual_review_required'"
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in visual inspection")
    issue_resolved: bool = Field(..., description="True if problem has been genuinely rectified")
    explanation: str = Field(..., description="Explainable rationale comparing before and after images")
    detected_changes: List[str] = Field(default_factory=list, description="Specific physical changes observed")
    recommendation: str = Field(..., description="Actionable recommendation for municipal dispatch")


class VerifyRequest(BaseModel):
    """
    Payload containing visual evidence for resolution audit.
    """
    before_image_url: str = Field(..., description="URL of initial complaint image")
    after_image_url: str = Field(..., description="URL of claimed resolution image")
    category: Optional[str] = Field(default=None, description="Reported civic category")
    description: Optional[str] = Field(default=None, description="Original complaint description")


class VerifyResponse(BaseModel):
    """
    Standardized API response for /verify.
    """
    success: bool = True
    data: VerificationResult
    meta: AIModelMeta

    # Backward compatibility properties
    @property
    def status(self) -> str:
        return self.data.verification_status.value

    @property
    def confidence(self) -> float:
        return self.data.confidence

    @property
    def reason(self) -> str:
        return self.data.explanation
