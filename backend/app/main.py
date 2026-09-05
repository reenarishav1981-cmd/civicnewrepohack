from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers.analyze import router as analyze_router
from app.routers.duplicate import router as duplicate_router
from app.routers.priority import router as priority_router
from app.routers.verify import router as verify_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register AI Engine Routers
app.include_router(analyze_router)
app.include_router(duplicate_router)
app.include_router(priority_router)
app.include_router(verify_router)


@app.get("/", tags=["System"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "configured_provider": settings.AI_PROVIDER,
        "documentation": "/docs",
    }


@app.get("/health", tags=["System"])
def health_check():
    has_gemini_key = bool(settings.GEMINI_API_KEY)
    has_openai_key = bool(settings.OPENAI_API_KEY)
    return {
        "status": "healthy",
        "ai_engine": {
            "provider": settings.AI_PROVIDER,
            "gemini_configured": has_gemini_key,
            "openai_configured": has_openai_key,
            "fallback_available": True,
        }
    }