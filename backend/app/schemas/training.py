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
