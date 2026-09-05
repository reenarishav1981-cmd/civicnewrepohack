from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class CivicCategory(str, Enum):
    POTHOLE = "pothole"
    ROAD_DAMAGE = "road_damage"
    GARBAGE = "garbage"
    WATER_LEAK = "water_leak"
    DRAINAGE = "drainage"
    SEWAGE = "sewage"
    STREETLIGHT = "streetlight"
    TRAFFIC_SIGNAL = "traffic_signal"
    FLOODING = "flooding"
    ILLEGAL_DUMPING = "illegal_dumping"
    PUBLIC_SAFETY = "public_safety"
    ELECTRICITY = "electricity"
    POLLUTION = "pollution"
    ENCROACHMENT = "encroachment"
    OTHER = "other"

class SeverityLabel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    IMMEDIATE = "immediate"

class LanguageType(str, Enum):
    ENGLISH = "english"
    HINDI = "hindi"
    HINGLISH = "hinglish"
    MIXED = "mixed"
    UNKNOWN = "unknown"

class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class VerificationStatus(str, Enum):
    VERIFIED_RESOLVED = "verified_resolved"
    PARTIALLY_RESOLVED = "partially_resolved"
    NOT_RESOLVED = "not_resolved"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    MANUAL_REVIEW_REQUIRED = "manual_review_required"

class AIModelMeta(BaseModel):
    """
    Transparent provenance metadata showing which model produced the result.
    """
    provider: str = Field(..., description="AI Provider: 'gemini', 'openai', or 'fallback'")
    model: str = Field(..., description="Specific model ID or heuristic engine name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence score")
    fallback: bool = Field(default=False, description="True if heuristic fallback was used instead of real AI")
    execution_time_ms: Optional[float] = Field(default=None, description="Execution time in milliseconds")
