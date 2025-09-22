from pydantic_settings import BaseSettings
from pydantic import field_validator
import json
import os


class Settings(BaseSettings):
    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Environment
    environment: str = "development"
    
    @field_validator('allowed_origins', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        print(f"DEBUG: Parsing allowed_origins value: {repr(v)} (type: {type(v)})")
        
        if v is None:
            print("DEBUG: Value is None, using default ['*']")
            return ["*"]
            
        if isinstance(v, str):
            # Handle empty string or whitespace
            if not v or not v.strip():
                print("DEBUG: Empty string, using default ['*']")
                return ["*"]
            try:
                # Try to parse as JSON first
                result = json.loads(v)
                print(f"DEBUG: Successfully parsed as JSON: {result}")
                return result
            except json.JSONDecodeError as e:
                print(f"DEBUG: JSON parsing failed: {e}, trying comma-separated")
                # If not JSON, treat as comma-separated string
                result = [origin.strip() for origin in v.split(',') if origin.strip()]
                print(f"DEBUG: Parsed as comma-separated: {result}")
                return result
        
        print(f"DEBUG: Returning value as-is: {v}")
        return v
    
    class Config:
        env_file = ".env"


print("DEBUG: Creating Settings instance...")
settings = Settings()
print(f"DEBUG: Settings created with allowed_origins: {settings.allowed_origins}")
