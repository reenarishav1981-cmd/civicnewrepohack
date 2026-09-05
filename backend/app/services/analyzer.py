from typing import Optional, Tuple
from app.schemas.analysis import AnalysisResult
from app.schemas.common import AIModelMeta
from app.services.ai_client import fetch_image_bytes
from app.services.ai_provider import get_ai_provider


def analyze_issue(
    description: str,
    image_url: Optional[str] = None,
) -> Tuple[AnalysisResult, AIModelMeta]:
    """
    Executes complaint intelligence via the configured AI provider.
    Returns (AnalysisResult, AIModelMeta) tuple.
    """
    provider = get_ai_provider()

    image_bytes = None
    mime_type = None

    if image_url:
        img_info = fetch_image_bytes(image_url)
        if img_info:
            image_bytes, mime_type = img_info

    result, meta = provider.analyze_complaint(
        description=description,
        image_bytes=image_bytes,
        mime_type=mime_type,
    )

    return result, meta