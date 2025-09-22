from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"


settings = Settings()
