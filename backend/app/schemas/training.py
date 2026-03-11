from pydantic import BaseModel, Field


class TempTrainingGenerateRequest(BaseModel):
    total_pairs: int = Field(default=1000, ge=10, le=1000)
    batch_size: int = Field(default=20, ge=5, le=50)
    overwrite: bool = True


class TempTrainingGenerateResponse(BaseModel):
    status: str
    generated_pairs: int
    requested_pairs: int
    dataset_path: str
    model_used: str


class TempTrainingBuildResponse(BaseModel):
    status: str
    pair_count: int
    model_path: str


class TempTrainingStatusResponse(BaseModel):
    pair_count: int
    dataset_path: str
    model_path: str
    model_ready: bool


class TempTrainingReplyRequest(BaseModel):
    message: str
    top_k: int = Field(default=3, ge=1, le=10)


class TempTrainingReplyResponse(BaseModel):
    reply: str
    source: str
    similarity: float
    matched_question: str


class ProductionTrainingGenerateRequest(BaseModel):
    total_pairs: int = Field(default=1000, ge=50, le=5000)
    batch_size: int = Field(default=10, ge=2, le=20)
    overwrite: bool = True


class ProductionTrainingGenerateResponse(BaseModel):
    status: str
    accepted_pairs: int
    requested_pairs: int
    dataset_path: str
    last_model_used: str


class ProductionTrainingStatusResponse(BaseModel):
    pair_count: int
    dataset_path: str
    evaluation_path: str
    export_dir: str
    lora_ready: bool
    run_state: str
    started_at: float | None = None
    last_update: float | None = None
    target_pairs: int
    accepted_pairs_in_run: int
    scanned_rows: int
    batch_attempts: int
    last_model_used: str | None = None
    last_error: str | None = None


class ProductionTrainingEvaluationResponse(BaseModel):
    status: str
    pair_count: int
    accepted_pairs: int
    acceptance_rate: float
    avg_question_words: float
    avg_answer_words: float
    by_emotion: dict[str, int]
    by_situation: dict[str, int]
    issue_counts: dict[str, int]
    report_path: str


class ProductionTrainingCleanResponse(BaseModel):
    status: str
    pair_count: int
    accepted_pairs: int
    normalized_rows: int
    dataset_path: str


class ProductionTrainingExportRequest(BaseModel):
    train_ratio: float = Field(default=0.9, gt=0.5, lt=0.99)
    overwrite: bool = True


class ProductionTrainingExportResponse(BaseModel):
    status: str
    train_examples: int
    valid_examples: int
    train_path: str
    valid_path: str
    config_path: str
    script_path: str
