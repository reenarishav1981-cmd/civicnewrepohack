from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import AIModelMeta, PriorityLevel


class ContributingFactors(BaseModel):
    """
    Transparent weights explaining how the priority score was computed.
    """
    base_severity_score: float = Field(..., description="Calculated from 1-5 severity scale (0-30 pts)")
    urgency_boost: float = Field(..., description="Boost based on time-critical nature (0-15 pts)")
    sensitive_location_boost: float = Field(..., description="Boost for schools, hospitals, transit (0-20 pts)")
    safety_risk_boost: float = Field(..., description="Boost for hazard/accident/electrocution (0-20 pts)")
    duplicate_density_boost: float = Field(..., description="Boost from volume of citizen reports (0-15 pts)")


class PriorityResult(BaseModel):
    """
    Structured outcome of the Priority Intelligence engine.
    """
    priority_score: int = Field(..., ge=0, le=100, description="Composite civic priority score from 0 to 100")
    priority_level: PriorityLevel = Field(..., description="'low', 'medium', 'high', or 'critical'")
    explanation: List[str] = Field(..., description="Clear human-readable breakdown of decision factors")
    contributing_factors: ContributingFactors


class PriorityRequest(BaseModel):
    """
    Payload to calculate dynamic civic priority.
    """
    severity: int = Field(..., ge=1, le=5, description="Issue severity from 1 to 5")
    urgency: Optional[str] = Field(default="medium", description="'low', 'medium', 'high', or 'immediate'")
    sensitive_location: bool = Field(default=False, description="Whether near sensitive municipal infrastructure")
    location_type: Optional[str] = Field(default=None, description="e.g. 'school', 'hospital', 'highway'")
    category: Optional[str] = Field(default="other", description="Civic category")
    duplicate_count: int = Field(default=0, ge=0, description="Number of duplicate/citizen reports for this issue")
    safety_risk: Optional[str] = Field(default=None, description="Specific safety risk identified")
    affected_population: Optional[str] = Field(default=None, description="Demographic impacted")
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)


class PriorityResponse(BaseModel):
    """
    Standardized API response for /priority.
    """
    success: bool = True
    data: PriorityResult
    meta: AIModelMeta
