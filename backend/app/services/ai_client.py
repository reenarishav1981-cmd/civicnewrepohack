import os
import httpx
from typing import Optional, Tuple
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Initialize Gemini Client if API key is provided
_client: Optional[genai.Client] = None

def get_ai_client() -> Optional[genai.Client]:
    """
    Returns an initialized Google GenAI Client instance if GEMINI_API_KEY is configured.
    """
    global _client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    if _client is None:
        try:
            _client = genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Warning: Failed to initialize Gemini GenAI client: {e}")
            return None

    return _client


def fetch_image_bytes(image_url: str) -> Optional[Tuple[bytes, str]]:
    """
    Downloads image bytes safely from a URL.
    Returns (image_bytes, mime_type) tuple, or None if download fails.
    """
    if not image_url or not image_url.startswith(("http://", "https://")):
        return None

    try:
        with httpx.Client(timeout=10.0, follow_redirects=True) as http_client:
            response = http_client.get(image_url)
            if response.status_code == 200 and response.content:
                mime = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
                if not mime.startswith("image/"):
                    mime = "image/jpeg"
                return response.content, mime
    except Exception as e:
        print(f"Failed to fetch image from URL '{image_url}': {e}")

    return None
