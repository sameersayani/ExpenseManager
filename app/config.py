import os
from dotenv import load_dotenv


load_dotenv()

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', None)
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', None)
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', None)
API_BASE_URL = os.environ.get('API_BASE_URL', None)
REACT_BASE_URL = os.environ.get('REACT_BASE_URL', None)
DATABASE_URL = os.getenv("DATABASE_URL")