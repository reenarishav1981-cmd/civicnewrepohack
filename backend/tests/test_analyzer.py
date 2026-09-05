import pytest
from app.schemas.analysis import AnalyzeRequest
from app.schemas.common import CivicCategory, SeverityLabel, UrgencyLevel
from app.services.analyzer import analyze_issue
from app.services.ai_provider import reset_ai_provider


def test_english_complaint():
    desc = "There is a massive water leak from the main pipe on MG Road causing water loss."
    result, meta = analyze_issue(desc)
    assert result.category == CivicCategory.WATER_LEAK.value
    assert result.language == "english"
    assert result.severity >= 3
    assert len(result.explanation) > 0


def test_hindi_complaint():
    # Devanagari script complaint
    desc = "सड़क पर बहुत बड़ा गड्ढा है और दुर्घटना का खतरा है"
    result, meta = analyze_issue(desc)
    assert result.category == CivicCategory.POTHOLE.value
    assert result.language in ["hindi", "mixed"]
    assert result.severity >= 4


def test_hinglish_complaint():
    desc = "School ke gate ke saamne bahut bada gaddha hai, bachchon ko accident ka risk hai."
    result, meta = analyze_issue(desc)
    assert result.category == CivicCategory.POTHOLE.value
    assert result.language == "hinglish"
    assert result.context.sensitive_location is True
    assert result.context.location_type == "school"
    assert result.severity >= 4


def test_garbage_category():
    desc = "Huge pile of rotting garbage and waste dumped on the roadside creating foul smell."
    result, meta = analyze_issue(desc)
    assert result.category == CivicCategory.GARBAGE.value
    assert result.severity >= 2


def test_water_leak_category():
    desc = "Potable water pipeline burst and continuous paani leakage flooding the lane."
    result, meta = analyze_issue(desc)
    assert result.category in [CivicCategory.WATER_LEAK.value, CivicCategory.FLOODING.value]


def test_streetlight_category():
    desc = "Streetlight on 5th cross road is not working and dark road causes safety hazard."
    result, meta = analyze_issue(desc)
    assert result.category == CivicCategory.STREETLIGHT.value


def test_emergency_severity():
    desc = "Live electric wire fell down on flooded road, severe sparking and electrocution emergency danger!"
    result, meta = analyze_issue(desc)
    assert result.category == CivicCategory.ELECTRICITY.value
    assert result.severity == 5
    assert result.severity_label == SeverityLabel.CRITICAL.value
    assert result.urgency == UrgencyLevel.IMMEDIATE.value


def test_unknown_category():
    desc = "Someone lost their red umbrella on the walkway yesterday afternoon."
    result, meta = analyze_issue(desc)
    assert result.category == CivicCategory.OTHER.value
    assert result.confidence <= 0.75


def test_fallback_attribution():
    # Verify that when API key is unconfigured or fallback is triggered, fallback=True is transparently set
    desc = "Broken drainage pipe overflowing into the street."
    result, meta = analyze_issue(desc)
    assert meta.provider in ["gemini", "fallback"]
    if meta.provider == "fallback":
        assert meta.fallback is True
