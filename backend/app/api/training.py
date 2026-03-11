from fastapi import APIRouter, HTTPException

from app.ml.production_training_service import (
    clean_production_dataset,
    evaluate_production_dataset,
    export_lora_dataset,
    generate_production_dataset,
    get_production_status,
)
from app.ml.temp_training_service import build_temp_model, generate_temp_dataset, get_temp_reply, get_temp_status
from app.schemas.training import (
    ProductionTrainingEvaluationResponse,
    ProductionTrainingExportRequest,
    ProductionTrainingExportResponse,
    ProductionTrainingCleanResponse,
    ProductionTrainingGenerateRequest,
    ProductionTrainingGenerateResponse,
    ProductionTrainingStatusResponse,
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


@router.get("/production/status", response_model=ProductionTrainingStatusResponse)
def production_training_status():
    return ProductionTrainingStatusResponse(**get_production_status())


@router.post("/production/generate", response_model=ProductionTrainingGenerateResponse)
def production_training_generate(payload: ProductionTrainingGenerateRequest):
    try:
        result = generate_production_dataset(
            total_pairs=payload.total_pairs,
            batch_size=payload.batch_size,
            overwrite=payload.overwrite,
        )
        return ProductionTrainingGenerateResponse(**result)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/production/evaluate", response_model=ProductionTrainingEvaluationResponse)
def production_training_evaluate():
    try:
        return ProductionTrainingEvaluationResponse(**evaluate_production_dataset())
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/production/clean", response_model=ProductionTrainingCleanResponse)
def production_training_clean():
    try:
        return ProductionTrainingCleanResponse(**clean_production_dataset())
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/production/export-lora", response_model=ProductionTrainingExportResponse)
def production_training_export(payload: ProductionTrainingExportRequest):
    try:
        result = export_lora_dataset(train_ratio=payload.train_ratio, overwrite=payload.overwrite)
        return ProductionTrainingExportResponse(**result)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
