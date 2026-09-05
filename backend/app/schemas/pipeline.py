from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import AIModelMeta
from app.schemas.analysis import AnalysisResult
from app.schemas.duplicate import DuplicateResult, ExistingIncident
from app.schemas.priority import PriorityResult


class FullAnalysisRequest(BaseModel):
    """
    Payload for complete end-to-end civic intelligence pipeline.
    """
    description: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Citizen's description of the civic issue in English, Hindi, or Hinglish"
    )
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    image_url: Optional[str] = Field(default=None, description="URL of photo evidence")
    existing_incidents: List[ExistingIncident] = Field(
        default_factory=list,
        description="Candidate nearby incidents provided by the Core Backend"
    )


class FullPipelineResult(BaseModel):
    complaint_analysis: AnalysisResult
    duplicate: DuplicateResult
    priority: PriorityResult


class FullPipelineResponse(BaseModel):
    """
    Unified end-to-end response for /analyze/full.
    """
    success: bool = True
    complaint_analysis: AnalysisResult
    duplicate: DuplicateResult
    priority: PriorityResult
    meta: AIModelMeta
