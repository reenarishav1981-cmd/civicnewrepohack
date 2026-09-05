from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.common import AIModelMeta


class ExistingIncident(BaseModel):
    """
    Existing incident retrieved from the core database by the Core Backend.
    """
    incident_id: str = Field(..., description="Unique incident identifier")
    description: str = Field(..., description="Original incident description")
    category: Optional[str] = Field(default=None, description="Category of the existing incident")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Latitude")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Longitude")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of when existing incident occurred")


class DuplicateSignals(BaseModel):
    """
    Breakdown of contributing signals used in duplicate determination.
    """
    semantic_similarity: float = Field(default=0.0, ge=0.0, le=1.0)
    category_match: bool = Field(default=False)
    distance_meters: Optional[float] = Field(default=None)
    proximity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    context_match: bool = Field(default=False)


class DuplicateResult(BaseModel):
    """
    Structured outcome of the duplicate detection engine.
    """
    is_duplicate: bool = Field(..., description="Whether this report matches an existing incident")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Composite similarity score")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Engine confidence")
    matched_incident_id: Optional[str] = Field(default=None, description="ID of the matching incident, if any")
    explanation: str = Field(..., description="Explainable rationale for the decision")
    signals_used: DuplicateSignals = Field(default_factory=DuplicateSignals)


class DuplicateRequest(BaseModel):
    """
    Payload sent by Core Backend to check for duplicates.
    """
    description: str = Field(..., min_length=3, max_length=2000)
    category: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    existing_incidents: List[ExistingIncident] = Field(default_factory=list)


class DuplicateResponse(BaseModel):
    """
    Standardized API response for /duplicate.
    """
    success: bool = True
    data: DuplicateResult
    meta: AIModelMeta

    # Backward compatibility properties
    @property
    def is_duplicate(self) -> bool:
        return self.data.is_duplicate

    @property
    def similarity(self) -> float:
        return self.data.similarity_score

    @property
    def matched_incident_id(self) -> Optional[str]:
        return self.data.matched_incident_id

    @property
    def reason(self) -> str:
        return self.data.explanation
