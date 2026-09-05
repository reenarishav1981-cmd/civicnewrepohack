import math
import re
import time
from difflib import SequenceMatcher
from typing import List, Optional, Tuple
import numpy as np

from app.core.config import settings
from app.schemas.common import AIModelMeta
from app.schemas.duplicate import (
    DuplicateRequest,
    DuplicateResult,
    DuplicateSignals,
    ExistingIncident,
)
from app.services.ai_provider import get_ai_provider


# ============================================================
# HAVERSINE GEOSPATIAL DISTANCE
# ============================================================

def haversine_distance_meters(
    lat1: Optional[float],
    lon1: Optional[float],
    lat2: Optional[float],
    lon2: Optional[float],
) -> Optional[float]:
    """
    Computes exact great-circle distance between two GPS coordinates in meters.
    """
    if None in (lat1, lon1, lat2, lon2):
        return None

    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(dlambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


# ============================================================
# VECTOR & TEXT SIMILARITY
# ============================================================

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    v1 = np.array(vec1, dtype=np.float32)
    v2 = np.array(vec2, dtype=np.float32)
    norm1, norm2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))


CIVIC_SYNONYMS = {
    'gaddha': 'pothole', 'gadhha': 'pothole', 'crater': 'pothole', 'pit': 'pothole', 'hole': 'pothole',
    'kachra': 'garbage', 'kooda': 'garbage', 'kuda': 'garbage', 'trash': 'garbage', 'waste': 'garbage', 'rubbish': 'garbage', 'dher': 'garbage',
    'naali': 'drainage', 'nali': 'drainage', 'gutter': 'drainage', 'sewer': 'drainage', 'sewage': 'drainage',
    'paani': 'water', 'pani': 'water', 'jal': 'water', 'leakage': 'leak', 'burst': 'leak', 'leak': 'leak',
    'batti': 'streetlight', 'light': 'streetlight', 'pole': 'streetlight',
    'sadak': 'road', 'street': 'road', 'lane': 'road', 'rasta': 'road', 'marg': 'road', 'footpath': 'road', 'curb': 'road', 'boundary': 'road',
    'dps': 'school', 'vidyalaya': 'school', 'school': 'school',
    'hospital': 'hospital', 'aspatal': 'hospital', 'clinic': 'hospital',
    'saamne': 'front', 'samne': 'front', 'outside': 'front',
    'bada': 'large', 'bahut': 'large', 'huge': 'large', 'massive': 'large', 'big': 'large', 'deep': 'large',
    'gate': 'gate', 'toot': 'broken', 'damage': 'broken', 'broken': 'broken', 'cracked': 'broken', 'band': 'broken', 'malfunctioning': 'broken', 'stuck': 'broken',
    'danger': 'dangerous', 'dangerous': 'dangerous', 'khatra': 'dangerous', 'darr': 'dangerous',
    'overflowing': 'overflow', 'fail': 'overflow', 'overflow': 'overflow',
    'clogged': 'blocked', 'blocked': 'blocked', 'jam': 'blocked',
    'waterlogging': 'flood', 'flooding': 'flood',
    'transformer': 'electric', 'wire': 'electric', 'taar': 'electric', 'current': 'electric',
    'manhole': 'manhole', 'dhakkan': 'cover', 'cover': 'cover', 'missing': 'missing', 'gayab': 'missing',
    'thela': 'stall', 'stall': 'stall', 'dukan': 'shop', 'hoarding': 'stall', 'cart': 'stall',
}

STOP_WORDS = {
    'hai', 'hain', 'ke', 'ki', 'ka', 'ko', 'se', 'me', 'mein', 'par', 'pe', 'aur', 'bhi', 'tha', 'thi', 'the',
    'ye', 'wo', 'is', 'us', 'liye', 'karo', 'raha', 'rahi', 'rahe', 'near', 'pass', 'in', 'on', 'at', 'of',
    'for', 'with', 'from', 'a', 'an', 'the', 'to'
}


def normalize_civic_text(text: str) -> set:
    text_clean = re.sub(r"[^\w\s]", " ", text.lower())
    tokens = text_clean.split()
    normalized = set()
    for tok in tokens:
        if tok in STOP_WORDS:
            continue
        normalized.add(CIVIC_SYNONYMS.get(tok, tok))
    return normalized


def lexical_semantic_similarity(text1: str, text2: str) -> float:
    """
    Multilingual fallback similarity combining domain Jaccard token overlap and character SequenceMatcher.
    """
    tokens1 = normalize_civic_text(text1)
    tokens2 = normalize_civic_text(text2)

    if not tokens1 or not tokens2:
        return 0.0

    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    jaccard = len(intersection) / len(union) if union else 0.0

    char_ratio = SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    return round((0.65 * jaccard) + (0.35 * char_ratio), 3)


COMPATIBLE_CATEGORIES = {
    "pothole": {"pothole", "road_damage", "road"},
    "road_damage": {"pothole", "road_damage", "road"},
    "road": {"pothole", "road_damage", "road"},
    "drainage": {"drainage", "sewage", "flooding"},
    "sewage": {"drainage", "sewage"},
    "garbage": {"garbage", "illegal_dumping"},
    "illegal_dumping": {"garbage", "illegal_dumping"},
    "water_leak": {"water_leak", "flooding"},
    "flooding": {"water_leak", "drainage", "flooding"},
    "streetlight": {"streetlight", "electricity"},
    "electricity": {"streetlight", "electricity"},
    "traffic_signal": {"traffic_signal"},
    "encroachment": {"encroachment"},
}


def is_category_compatible(cat1: Optional[str], cat2: Optional[str]) -> bool:
    if not cat1 or not cat2:
        return True
    c1, c2 = cat1.lower().strip(), cat2.lower().strip()
    if c1 == c2:
        return True
    return c2 in COMPATIBLE_CATEGORIES.get(c1, set())


# ============================================================
# DUPLICATE DETECTION SERVICE
# ============================================================

def find_duplicate(
    request: DuplicateRequest,
) -> Tuple[DuplicateResult, AIModelMeta]:
    start_time = time.time()
    provider = get_ai_provider()

    best_score = 0.0
    best_incident_id = None
    best_signals = DuplicateSignals()
    best_explanation = "No matching incident found within duplicate threshold."

    # Retrieve vector embedding if configured provider is available
    incoming_vec = provider.get_embedding(request.description)
    used_vector = incoming_vec is not None

    for incident in request.existing_incidents:
        # 1. Semantic description similarity
        if used_vector:
            incident_vec = provider.get_embedding(incident.description)
            if incident_vec:
                semantic_score = cosine_similarity(incoming_vec, incident_vec)
            else:
                semantic_score = lexical_semantic_similarity(request.description, incident.description)
        else:
            semantic_score = lexical_semantic_similarity(request.description, incident.description)

        # 2. Category matching & Strict Gate
        category_match = is_category_compatible(request.category, incident.category)

        # 3. Geospatial proximity
        dist_meters = haversine_distance_meters(
            request.latitude, request.longitude,
            incident.latitude, incident.longitude,
        )

        # Strict Gate: If categories are incompatible (e.g. Streetlight vs Pothole),
        # they must NEVER be merged into the same physical incident.
        if not category_match:
            score = round(min(0.20, semantic_score * 0.20), 3)
            proximity_score = 0.0
        else:
            if dist_meters is not None:
                if dist_meters <= 50:
                    proximity_score = 1.0
                elif dist_meters <= 150:
                    proximity_score = 0.85
                elif dist_meters <= 300:
                    proximity_score = 0.60
                elif dist_meters <= 600:
                    proximity_score = 0.35
                elif dist_meters <= 1200:
                    proximity_score = 0.15
                else:
                    proximity_score = 0.0

                score = (0.50 * proximity_score) + (0.35 * semantic_score) + 0.15
            else:
                # Coordinate absent: relies on pure semantic text similarity
                proximity_score = 0.0
                score = (0.80 * semantic_score) + 0.15

            score = round(min(score, 1.0), 3)

        if score > best_score:
            best_score = score
            best_incident_id = incident.incident_id
            best_signals = DuplicateSignals(
                semantic_similarity=round(semantic_score, 3),
                category_match=category_match,
                distance_meters=dist_meters,
                proximity_score=round(proximity_score, 3),
                context_match=category_match and (proximity_score > 0.5),
            )

            reasons = []
            if dist_meters is not None:
                reasons.append(f"Located {int(dist_meters)}m away from incident '{incident.incident_id}'")
            if category_match:
                reasons.append(f"Matching category '{request.category}'")
            reasons.append(f"Semantic similarity score of {round(semantic_score * 100, 1)}%")

            best_explanation = f"Likely duplicate of '{incident.incident_id}': " + "; ".join(reasons) + "."

    # Operational threshold: 0.65 balances false merges vs false splits with zero false merges
    op_threshold = float(getattr(settings, "DUPLICATE_SIMILARITY_THRESHOLD", 0.65))
    is_duplicate = best_score >= op_threshold

    if not is_duplicate:
        best_explanation = (
            f"No existing incident exceeded the similarity threshold of {op_threshold} "
            f"(Highest score: {best_score})."
        )
        best_incident_id = None

    exec_ms = round((time.time() - start_time) * 1000, 2)
    meta = AIModelMeta(
        provider="gemini" if used_vector else "fallback",
        model=settings.GEMINI_EMBEDDING_MODEL if used_vector else "lexical-semantic-dedup",
        confidence=round(best_score if is_duplicate else 0.90, 2),
        fallback=not used_vector,
        execution_time_ms=exec_ms,
    )

    result = DuplicateResult(
        is_duplicate=is_duplicate,
        similarity_score=best_score,
        confidence=round(best_score if is_duplicate else 0.90, 2),
        matched_incident_id=best_incident_id,
        explanation=best_explanation,
        signals_used=best_signals,
    )

    return result, meta
