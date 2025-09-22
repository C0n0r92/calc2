# Digital Ocean Python Backend Detection Entry Point
# This file helps Digital Ocean auto-detect the Python backend component
# The actual backend code is in the backend/ directory

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Import and run the FastAPI app from the backend directory
from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
