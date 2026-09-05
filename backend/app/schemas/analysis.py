from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import AIModelMeta


# ============================================================
# COMPLAINT ANALYSIS SCHEMAS
# ============================================================

class ContextData(BaseModel):
    """
    Contextual information detected around the reported civic incident.
    """
    sensitive_location: bool = Field(default=False, description="True if near school, hospital, busy transit, etc.")
    location_type: Optional[str] = Field(default=None, description="e.g., 'school', 'hospital', 'market', 'highway'")
    affected_population: Optional[str] = Field(default=None, description="e.g., 'schoolchildren', 'pedestrians', 'commuters'")
    safety_risk: Optional[str] = Field(default=None, description="e.g., 'road accident', 'waterborne disease', 'electrocution'")


class AnalysisResult(BaseModel):
    """
    Structured civic complaint intelligence.
    """
    category: str = Field(..., description="Civic category (e.g., 'pothole', 'garbage', 'water_leak', etc.)")
    subcategory: Optional[str] = Field(default=None, description="Granular subcategory if identifiable")
    severity: int = Field(..., ge=1, le=5, description="Severity rating from 1 (minor) to 5 (critical danger)")
    severity_label: str = Field(..., description="'low', 'medium', 'high', or 'critical'")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence in this assessment")
    language: str = Field(..., description="'english', 'hindi', 'hinglish', 'mixed', or 'unknown'")
    urgency: str = Field(default="medium", description="'low', 'medium', 'high', or 'immediate'")
    context: ContextData = Field(default_factory=ContextData)
    explanation: List[str] = Field(default_factory=list, description="Concise human-readable decision factors")


class AnalyzeRequest(BaseModel):
    """
    Citizen complaint submission payload.
    """
    description: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Citizen's description of the civic issue in English, Hindi, or Hinglish"
    )
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="GPS latitude")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="GPS longitude")
    image_url: Optional[str] = Field(default=None, description="URL of photo evidence")


class AnalyzeResponse(BaseModel):
    """
    Standardized API response for /analyze.
    """
    success: bool = True
    data: AnalysisResult
    meta: AIModelMeta

    # Backward compatibility: allows response.analysis access
    @property
    def analysis(self) -> AnalysisResult:
        return self.data