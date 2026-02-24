"""
Safety Check API.

Comprehensive crisis language detection with risk levels,
specific flags, and contextual recommendations.
"""
import logging
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


class SafetyRequest(BaseModel):
    text: str


class SafetyResponse(BaseModel):
    riskLevel: str
    flags: list[str]
    recommendation: str | None = None


# ─── Safety keyword categories ────────────────────────────────────────
SELF_HARM_KEYWORDS = [
    "kill myself", "end my life", "want to die", "wanna die", "wish i was dead",
    "better off dead", "dont want to live", "suicide", "suicidal",
    "cut myself", "cutting", "self harm", "self-harm", "hurt myself",
    "harm myself", "end it all", "no reason to live", "not worth living",
]

HOPELESSNESS_KEYWORDS = [
    "hopeless", "no hope", "cant go on", "cant keep going", "no point",
    "pointless", "whats the point", "never get better", "never gets better",
    "nothing matters", "meaningless", "no future", "no way out",
    "trapped", "cant escape", "giving up", "given up", "surrender",
]

ISOLATION_KEYWORDS = [
    "nobody cares", "no one cares", "all alone", "completely alone",
    "no one understands", "nobody understands", "no one to turn to",
    "no one would notice", "wouldnt be missed", "invisible to everyone",
    "burden to everyone", "burden on", "im a burden",
]

SUBSTANCE_KEYWORDS = [
    "drinking too much", "cant stop drinking", "drugs", "substance",
    "overdose", "pills", "addicted", "addiction", "relapse",
    "getting high", "drunk", "wasted", "numb the pain",
]

CRISIS_KEYWORDS = [
    "emergency", "crisis", "help me", "please help", "911",
    "call for help", "need help now", "urgent", "immediate danger",
    "im scared", "im terrified", "something bad",
]


def _check_keywords(text: str, keywords: list[str]) -> bool:
    """Check if any keywords appear in text."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in keywords)


@router.post("/check", response_model=SafetyResponse)
def check(payload: SafetyRequest):
    text = payload.text
    flags: list[str] = []

    if _check_keywords(text, SELF_HARM_KEYWORDS):
        flags.append("self_harm")

    if _check_keywords(text, HOPELESSNESS_KEYWORDS):
        flags.append("hopelessness")

    if _check_keywords(text, ISOLATION_KEYWORDS):
        flags.append("isolation")

    if _check_keywords(text, SUBSTANCE_KEYWORDS):
        flags.append("substance")

    if _check_keywords(text, CRISIS_KEYWORDS):
        flags.append("crisis")

    # Determine risk level
    if "self_harm" in flags or "crisis" in flags:
        risk = "high"
    elif len(flags) >= 2:
        risk = "high"
    elif flags:
        risk = "medium"
    else:
        risk = "low"

    # Contextual recommendation
    recommendation = None
    if risk == "high":
        recommendation = (
            "You seem to be going through something very difficult. "
            "Please reach out to someone you trust or contact a crisis helpline. "
            "You matter, and help is available. 💜"
        )
    elif risk == "medium":
        recommendation = (
            "It sounds like you might be struggling. "
            "Talking to someone you trust could really help. You're not alone."
        )

    logger.info(f"🛡️ SAFETY CHECK: '{payload.text[:60]}' → risk={risk}, flags={flags}")

    return SafetyResponse(
        riskLevel=risk,
        flags=flags,
        recommendation=recommendation,
    )
