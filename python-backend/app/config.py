from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"


settings = Settings()
