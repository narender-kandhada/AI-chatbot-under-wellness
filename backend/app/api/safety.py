from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SafetyRequest(BaseModel):
    text: str

class SafetyResponse(BaseModel):
    riskLevel: str
    flags: list[str]
    recommendation: str | None = None

@router.post("/check", response_model=SafetyResponse)
def check(payload: SafetyRequest):
    flags = []

    if "die" in payload.text.lower():
        flags.append("self-harm")

    risk = "high" if flags else "low"

    return SafetyResponse(
        riskLevel=risk,
        flags=flags,
        recommendation="Please reach out to someone you trust."
        if risk == "high" else None
    )
