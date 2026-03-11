from fastapi import APIRouter, HTTPException

from app.ml.temp_training_service import build_temp_model, generate_temp_dataset, get_temp_reply, get_temp_status
from app.schemas.training import (
    TempTrainingBuildResponse,
    TempTrainingGenerateRequest,
    TempTrainingGenerateResponse,
    TempTrainingReplyRequest,
    TempTrainingReplyResponse,
    TempTrainingStatusResponse,
)

router = APIRouter()


@router.get("/temp/status", response_model=TempTrainingStatusResponse)
def temp_training_status():
    return TempTrainingStatusResponse(**get_temp_status())


@router.post("/temp/generate", response_model=TempTrainingGenerateResponse)
def temp_training_generate(payload: TempTrainingGenerateRequest):
    try:
        result = generate_temp_dataset(
            total_pairs=payload.total_pairs,
            batch_size=payload.batch_size,
            overwrite=payload.overwrite,
        )
        return TempTrainingGenerateResponse(**result)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/temp/build", response_model=TempTrainingBuildResponse)
def temp_training_build():
    try:
        return TempTrainingBuildResponse(**build_temp_model())
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/temp/respond", response_model=TempTrainingReplyResponse)
def temp_training_respond(payload: TempTrainingReplyRequest):
    try:
        return TempTrainingReplyResponse(**get_temp_reply(payload.message, payload.top_k))
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
