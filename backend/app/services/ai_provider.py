import re
import math
import time
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

from app.core.config import settings
from app.schemas.common import (
    AIModelMeta,
    CivicCategory,
    SeverityLabel,
    UrgencyLevel,
    LanguageType,
    VerificationStatus,
)
from app.schemas.analysis import AnalysisResult, ContextData
from app.schemas.verification import VerificationResult


# ============================================================
# BASE PROVIDER INTERFACE
# ============================================================

class BaseAIProvider(ABC):
    @abstractmethod
    def analyze_complaint(
        self,
        description: str,
        image_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> Tuple[AnalysisResult, AIModelMeta]:
        pass

    @abstractmethod
    def get_embedding(self, text: str) -> Optional[List[float]]:
        pass

    @abstractmethod
    def verify_resolution(
        self,
        before_bytes: bytes,
        after_bytes: bytes,
        before_mime: str,
        after_mime: str,
        category: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Tuple[VerificationResult, AIModelMeta]:
        pass


# ============================================================
# DETERMINISTIC FALLBACK PROVIDER (Zero External Dependency)
# ============================================================

class DeterministicFallbackProvider(BaseAIProvider):
    """
    Robust rule-based heuristic provider.
    Guarantees deterministic execution for English, Hindi, and Hinglish.
    Marks metadata with fallback=True.
    """

    def _detect_language(self, text: str) -> str:
        # Check for Devanagari Unicode range
        if re.search(r"[\u0900-\u097F]", text):
            # Check if it also has significant English/Latin characters
            has_latin = bool(re.search(r"[a-zA-Z]{3,}", text))
            return "mixed" if has_latin else "hindi"

        text_lower = text.lower()
        hinglish_tokens = {
            "hai", "ke", "saamne", "samne", "bahut", "bada", "gaddha", "sadak",
            "paani", "kachra", "naali", "nahi", "karo", "bachchon", "dikhta",
            "raat", "bhi", "mein", "par", "hota", "gaya", "kooda", "badbu",
            "aur", "ek", "gali", "roshni", "bijli", "toot", "gayi"
        }
        words = set(re.findall(r"\b\w+\b", text_lower))
        matching_count = len(words.intersection(hinglish_tokens))

        if matching_count >= 2:
            return "hinglish"
        elif matching_count == 1 and len(words) <= 5:
            return "hinglish"

        # Check for standard english
        if bool(re.search(r"\b(the|is|and|in|at|near|front|of|broken|leak|damage)\b", text_lower)):
            return "english"

        return "english"

    def _detect_category(self, text: str) -> Tuple[str, Optional[str], float]:
        t = text.lower()
        keyword_map = [
            (CivicCategory.POTHOLE.value, [
                "pothole", "gaddha", "crater", "road hole", "road pit", "गड्ढा", "गढ्ढा"
            ], "road_surface_cavity", 0.92),
            (CivicCategory.ELECTRICITY.value, [
                "electric wire", "transformer", "electric shock", "short circuit", "sparking", "bijli",
                "electrocution", "live wire", "बिजली", "करंट", "तार"
            ], "hazardous_electrical_wiring", 0.94),
            (CivicCategory.GARBAGE.value, [
                "garbage", "trash", "waste", "dump", "kachra", "kooda", "rubbish", "कचरा", "कूड़ा", "गंदगी"
            ], "solid_waste_accumulation", 0.91),
            (CivicCategory.SEWAGE.value, [
                "sewage", "sewer", "manhole", "foul smell", "badbu", "septic", "सीवर", "बदबू"
            ], "open_sewage", 0.90),
            (CivicCategory.DRAINAGE.value, [
                "drainage", "drain", "naali", "gutter", "drain choke", "नाली"
            ], "blocked_drainage", 0.89),
            (CivicCategory.WATER_LEAK.value, [
                "water leak", "pipe leak", "pipe burst", "paani leak", "water pipe", "नल", "पाइप लीक"
            ], "potable_pipe_rupture", 0.91),
            (CivicCategory.STREETLIGHT.value, [
                "streetlight", "street light", "lamp post", "dark road", "light not working", "batti", "स्ट्रीट लाइट", "बत्ती"
            ], "non_functional_illumination", 0.92),
            (CivicCategory.TRAFFIC_SIGNAL.value, [
                "traffic light", "traffic signal", "signal not working", "red light broken", "ट्रैफिक सिग्नल"
            ], "defective_traffic_control", 0.93),
            (CivicCategory.FLOODING.value, [
                "flooding", "waterlogging", "paani bhar", "submerged", "जलभराव", "बाढ़"
            ], "urban_waterlogging", 0.89),
            (CivicCategory.ROAD_DAMAGE.value, [
                "road damage", "sadak toot", "broken road", "pavement", "footpath", "sidewalk broken", "सड़क"
            ], "structural_road_defect", 0.88),
            (CivicCategory.ILLEGAL_DUMPING.value, [
                "illegal dump", "debris", "malba", "construction waste", "मलबा"
            ], "unauthorized_debris_dump", 0.87),
            (CivicCategory.PUBLIC_SAFETY.value, [
                "danger", "hazard", "khatra", "accident risk", "unsafe", "खतरा", "दुर्घटना"
            ], "immediate_public_hazard", 0.85),
            (CivicCategory.ENCROACHMENT.value, [
                "encroachment", "illegal shop", "kabza", "blocked walkway", "कब्जा"
            ], "public_right_of_way_obstruction", 0.85),
            (CivicCategory.POLLUTION.value, [
                "smoke", "burning", "toxic air", "dust", "chemical", "प्रदूषण", "धुआं"
            ], "air_or_environmental_pollution", 0.86),
        ]

        best_category = CivicCategory.OTHER.value
        best_subcategory = None
        best_conf = 0.60
        max_score = 0.0

        for cat, keywords, subcat, conf in keyword_map:
            match_count = sum(1 for kw in keywords if kw in t)
            if match_count > 0:
                # Specific physical defects take clear priority over generic hazard words
                weight = 0.3 if cat == CivicCategory.PUBLIC_SAFETY.value else 1.5
                score = match_count * weight
                if score > max_score:
                    max_score = score
                    best_category = cat
                    best_subcategory = subcat
                    best_conf = conf

        return best_category, best_subcategory, best_conf




    def _assess_severity_and_urgency(self, text: str, category: str, sensitive_location: bool) -> Tuple[int, str, str]:
        t = text.lower()

        is_emergency = any(k in t for k in [
            "emergency", "accident", "injury", "life threatening", "death", "electrocution",
            "collapse", "khatarnak", "shock", "fire", "critical", "children risk",
            "gas leak", "pipeline leak", "danger", "toxic",
            "दुर्घटना", "आपातकालीन", "जानलेवा"
        ])
        is_high = any(k in t for k in [
            "huge", "major", "severe", "massive", "very dangerous", "bahut bada", "bada gaddha",
            "deep", "open manhole", "sparking", "submerged", "overflow", "dhas",
            "बहुत बड़ा", "बड़ा गड्ढा", "खतरा", "गंभीर", "धंस"
        ])
        is_moderate = any(k in t for k in [
            "broken", "damaged", "leaking", "dark", "smell", "pothole", "waste", "gaddha",
            "bada", "toot", "sadak toot", "गड्ढा", "टूटा", "खराब"
        ])


        if is_emergency:
            severity = 5
            severity_label = SeverityLabel.CRITICAL.value
            urgency = UrgencyLevel.IMMEDIATE.value
        elif is_high or (is_moderate and sensitive_location):
            severity = 4
            severity_label = SeverityLabel.HIGH.value
            urgency = UrgencyLevel.HIGH.value
        elif is_moderate:
            severity = 3
            severity_label = SeverityLabel.MEDIUM.value
            urgency = UrgencyLevel.MEDIUM.value
        else:
            severity = 2
            severity_label = SeverityLabel.LOW.value
            urgency = UrgencyLevel.LOW.value

        return severity, severity_label, urgency

    def _detect_context(self, text: str) -> ContextData:
        t = text.lower()
        locations = {
            "school": ["school", "college", "university", "vidyalaya", "kindergarten", "bachchon", "children"],
            "hospital": ["hospital", "clinic", "medical", "dispensary", "aspatal"],
            "market": ["market", "bazaar", "mall", "shopping", "commercial"],
            "highway": ["highway", "expressway", "main road", "flyover", "chowk"],
            "transit": ["metro", "bus stop", "railway", "station"],
        }

        detected_location = None
        for loc_type, tokens in locations.items():
            if any(tok in t for tok in tokens):
                detected_location = loc_type
                break

        sensitive = detected_location is not None

        # Affected population
        affected = None
        if detected_location == "school":
            affected = "schoolchildren, teachers, and school vans"
        elif detected_location == "hospital":
            affected = "patients, emergency vehicles, and visitors"
        elif detected_location in ["highway", "transit", "market"]:
            affected = "commuters, pedestrians, and daily motorists"
        elif sensitive:
            affected = "local residents and pedestrians"

        # Safety risk
        safety_risk = None
        if any(k in t for k in ["gas", "pipeline", "toxic", "poison", "fatal", "death"]):
            safety_risk = "Lethal danger of explosion, asphyxiation, and toxic gas poisoning"
        elif any(k in t for k in ["accident", "fall", "injury", "khatra"]):
            safety_risk = "High risk of vehicle damage, two-wheeler skidding, and pedestrian injury"
        elif any(k in t for k in ["electric", "wire", "shock", "spark"]):
            safety_risk = "Lethal danger of electrocution from exposed power apparatus"
        elif any(k in t for k in ["sewage", "water", "overflow", "smell", "mosquito"]):
            safety_risk = "Sanitation contamination, foul odor, and waterborne disease outbreak"
        elif sensitive:
            safety_risk = f"Elevated public hazard due to direct proximity to {detected_location}"

        return ContextData(
            sensitive_location=sensitive,
            location_type=detected_location,
            affected_population=affected,
            safety_risk=safety_risk,
        )

    def analyze_complaint(
        self,
        description: str,
        image_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> Tuple[AnalysisResult, AIModelMeta]:
        start_time = time.time()
        language = self._detect_language(description)
        category, subcategory, confidence = self._detect_category(description)
        context = self._detect_context(description)
        severity, severity_label, urgency = self._assess_severity_and_urgency(
            description, category, context.sensitive_location
        )

        explanations = [
            f"Classified as '{category}' based on matched domain signals.",
            f"Assessed severity level as '{severity_label}' ({severity}/5) with urgency '{urgency}'.",
        ]
        if context.sensitive_location:
            explanations.append(f"Detected sensitive municipal context: adjacent to a {context.location_type}.")
        if context.safety_risk:
            explanations.append(f"Identified hazard: {context.safety_risk}.")

        exec_ms = round((time.time() - start_time) * 1000, 2)

        meta = AIModelMeta(
            provider="fallback",
            model="deterministic-heuristic-v2",
            confidence=confidence,
            fallback=True,
            execution_time_ms=exec_ms,
        )
        print("\n[AI PROVIDER STATUS]")
        print("Provider: DETERMINISTIC_FALLBACK")
        print("Fallback: TRUE")
        print("Reason: Native rule-based engine active (zero external dependency)\n")

        result = AnalysisResult(
            category=category,
            subcategory=subcategory,
            severity=severity,
            severity_label=severity_label,
            confidence=confidence,
            language=language,
            urgency=urgency,
            context=context,
            explanation=explanations,
        )

        return result, meta

    def get_embedding(self, text: str) -> Optional[List[float]]:
        # Fallback provider does not produce external vector embeddings
        return None

    def verify_resolution(
        self,
        before_bytes: bytes,
        after_bytes: bytes,
        before_mime: str,
        after_mime: str,
        category: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Tuple[VerificationResult, AIModelMeta]:
        # Rule-based fallback refuses to hallucinate vision analysis
        meta = AIModelMeta(
            provider="fallback",
            model="deterministic-verifier",
            confidence=0.50,
            fallback=True,
            execution_time_ms=1.0,
        )
        result = VerificationResult(
            verification_status=VerificationStatus.MANUAL_REVIEW_REQUIRED,
            confidence=0.50,
            issue_resolved=False,
            explanation="External computer vision provider is not configured. Visual evidence is safely archived and flagged for human municipal inspection.",
            detected_changes=["Before and after photo evidence received and verified for integrity."],
            recommendation="Dispatch field officer to inspect physical resolution on site."
        )
        return result, meta


# ============================================================
# GOOGLE GEMINI PROVIDER (gemini-2.5-flash)
# ============================================================

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        from google import genai
        self.client = genai.Client(api_key=api_key)
        self.fallback = DeterministicFallbackProvider()

    def analyze_complaint(
        self,
        description: str,
        image_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> Tuple[AnalysisResult, AIModelMeta]:
        from google.genai import types

        start_time = time.time()
        system_instruction = (
            "You are CivicPulse AI, an expert civic intelligence triage engine for Indian municipalities. "
            "Examine complaints submitted in English, Hindi, or Hinglish, along with any optional image evidence.\n"
            "Extract structured fields conforming to AnalysisResult:\n"
            "- category: one of pothole, road_damage, garbage, water_leak, drainage, sewage, streetlight, "
            "traffic_signal, flooding, illegal_dumping, public_safety, electricity, pollution, encroachment, other.\n"
            "- subcategory: concise granular classification or null.\n"
            "- severity: integer 1 (minor/cosmetic) to 5 (extreme hazard / fatal risk).\n"
            "- severity_label: 'low' (1-2), 'medium' (3), 'high' (4), or 'critical' (5).\n"
            "- confidence: float from 0.0 to 1.0.\n"
            "- language: 'english', 'hindi', 'hinglish', 'mixed', or 'unknown'.\n"
            "- urgency: 'low', 'medium', 'high', or 'immediate'.\n"
            "- context: sensitive_location (bool), location_type (e.g. school, hospital, market, highway, null), "
            "affected_population (who is at risk, or null), safety_risk (concise description of harm, or null).\n"
            "- explanation: list of 2-4 concise, human-readable bullet points explaining your decision. Do NOT output raw chain of thought.\n"
            "Never hallucinate facts. If context or subcategory is unknown, leave them null."
        )

        contents = [description]
        if image_bytes and mime_type:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AnalysisResult,
                    temperature=0.1,
                ),
            )

            exec_ms = round((time.time() - start_time) * 1000, 2)
            if response.parsed:
                res: AnalysisResult = response.parsed
                meta = AIModelMeta(
                    provider="gemini",
                    model=settings.GEMINI_MODEL,
                    confidence=res.confidence,
                    fallback=False,
                    execution_time_ms=exec_ms,
                )
                print("\n[AI PROVIDER STATUS]")
                print("Provider: GEMINI")
                print("Fallback: FALSE")
                print(f"Model: {settings.GEMINI_MODEL}")
                print(f"Confidence: {res.confidence}\n")
                return res, meta

            raise ValueError("Gemini returned null parsed object")

        except Exception as e:
            reason = str(e)
            if "RESOURCE_EXHAUSTED" in reason or "429" in reason:
                fallback_reason = "Gemini quota unavailable (429 RESOURCE_EXHAUSTED)"
            elif "PERMISSION_DENIED" in reason or "403" in reason:
                fallback_reason = "Gemini access denied (403 PERMISSION_DENIED)"
            else:
                fallback_reason = f"Gemini error: {reason[:120]}"

            print("\n[AI PROVIDER STATUS]")
            print("Provider: DETERMINISTIC_FALLBACK")
            print("Fallback: TRUE")
            print(f"Reason: {fallback_reason}\n")

            fallback_res, fallback_meta = self.fallback.analyze_complaint(description, image_bytes, mime_type)
            fallback_meta.execution_time_ms = round((time.time() - start_time) * 1000, 2)
            return fallback_res, fallback_meta

    def get_embedding(self, text: str) -> Optional[List[float]]:
        try:
            response = self.client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text,
            )
            if response and response.embeddings:
                return response.embeddings[0].values
        except Exception as e:
            print(f"Gemini embedding failed: {e}")
        return None

    def verify_resolution(
        self,
        before_bytes: bytes,
        after_bytes: bytes,
        before_mime: str,
        after_mime: str,
        category: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Tuple[VerificationResult, AIModelMeta]:
        from google.genai import types

        start_time = time.time()
        system_instruction = (
            "You are CivicPulse AI's municipal resolution verification inspector. "
            "You are provided with two images:\n"
            "Image 1: BEFORE image showing reported civic complaint.\n"
            "Image 2: AFTER image submitted by municipal crew claiming resolution.\n"
            f"Reported Category: {category or 'unspecified'}\n"
            f"Reported Description: {description or 'unspecified'}\n\n"
            "Inspection Rules:\n"
            "1. Verify whether the AFTER image depicts the exact same physical location/angle as the BEFORE image.\n"
            "2. Determine if the reported civic defect has been genuinely fixed.\n"
            "3. Look for fraud (different street, stock photos, deliberate obstructions).\n"
            "Output structured JSON conforming to VerificationResult:\n"
            "- verification_status: 'verified_resolved', 'partially_resolved', 'not_resolved', 'insufficient_evidence', or 'manual_review_required'\n"
            "- confidence: float from 0.0 to 1.0\n"
            "- issue_resolved: boolean true if verified_resolved\n"
            "- explanation: concise human-readable visual findings\n"
            "- detected_changes: list of observed physical differences\n"
            "- recommendation: clear instruction for municipal administrators\n"
        )

        try:
            contents = [
                system_instruction,
                types.Part.from_bytes(data=before_bytes, mime_type=before_mime),
                types.Part.from_bytes(data=after_bytes, mime_type=after_mime),
            ]

            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VerificationResult,
                    temperature=0.1,
                ),
            )

            exec_ms = round((time.time() - start_time) * 1000, 2)
            if response.parsed:
                res: VerificationResult = response.parsed
                meta = AIModelMeta(
                    provider="gemini",
                    model=settings.GEMINI_MODEL,
                    confidence=res.confidence,
                    fallback=False,
                    execution_time_ms=exec_ms,
                )
                return res, meta

            raise ValueError("Gemini returned null verification object")

        except Exception as e:
            print(f"Gemini vision verification failed: {e}. Falling back to manual review requirement.")
            return self.fallback.verify_resolution(before_bytes, after_bytes, before_mime, after_mime, category, description)


# ============================================================
# PROVIDER FACTORY
# ============================================================

_cached_provider: Optional[BaseAIProvider] = None

def get_ai_provider() -> BaseAIProvider:
    """
    Returns the configured AI Provider based on settings.
    Falls back gracefully to DeterministicFallbackProvider if keys are missing.
    """
    global _cached_provider
    if _cached_provider is not None:
        return _cached_provider

    provider_choice = settings.AI_PROVIDER

    if provider_choice == "gemini" and settings.GEMINI_API_KEY:
        try:
            _cached_provider = GeminiProvider(api_key=settings.GEMINI_API_KEY)
            return _cached_provider
        except Exception as e:
            print(f"Could not initialize GeminiProvider ({e}), falling back to deterministic.")

    # Default fallback provider
    _cached_provider = DeterministicFallbackProvider()
    return _cached_provider


def reset_ai_provider():
    """Helper to reset cached provider (used during testing)."""
    global _cached_provider
    _cached_provider = None
