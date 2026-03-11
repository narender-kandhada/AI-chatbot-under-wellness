from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENV: str = "development"
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
