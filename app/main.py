import os
import uvicorn
from .app import app  # Importing FastAPI instance from app module
from mangum import Mangum  # Required for Passenger (ASGI compatibility)

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",  # Required for cPanel
        port=int(os.environ.get("PORT", 8000)),  # Fetch port dynamically
        reload=False  # Disable auto-reload in production
    )
else:
    application = Mangum(app)  # Required for cPanel's Passenger
