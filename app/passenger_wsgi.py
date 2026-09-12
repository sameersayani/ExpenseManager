import sys
import os
from app.app import app  # Import FastAPI app from api folder
from uvicorn import run

sys.path.insert(0, os.path.dirname(__file__))

def application(environ, start_response):
    """This function is called when Passenger starts the app"""
    run(app, host="127.0.0.1", port=8000)
