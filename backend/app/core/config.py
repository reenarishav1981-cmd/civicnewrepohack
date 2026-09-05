import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "CivicPulse AI Engine"
    VERSION: str = "2.0.0"
    DESCRIPTION: str = "AI-powered civic issue intelligence platform for complaint triage, deduplication, prioritization, and resolution verification."
    
    # AI Provider configuration: "gemini" | "openai" | "fallback"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini").lower()
    
    # API Keys
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # Model Configurations
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    
    # Operational thresholds
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "15.0"))
    DUPLICATE_SIMILARITY_THRESHOLD: float = float(os.getenv("DUPLICATE_SIMILARITY_THRESHOLD", "0.65"))

settings = Settings()
