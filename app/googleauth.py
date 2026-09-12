import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from dotenv import load_dotenv
import os
from fastapi import FastAPI, APIRouter, Depends, Request
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.openapi.docs import get_swagger_ui_html
import jwt
from datetime import datetime, timedelta
import random
import string

# Load environment variables from .env file
load_dotenv()

# Fetch configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY")
API_BASE_URL = os.environ.get('API_BASE_URL')
REACT_BASE_URL = os.environ.get('REACT_BASE_URL')



if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not SECRET_KEY:
    raise RuntimeError("Missing required environment variables")

# Initialize OAuth
oauth = OAuth()
google = oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# # In-memory session storage (for demonstration)
# user_sessions = {}

# OAuth2 scheme
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://accounts.google.com/o/oauth2/auth",
    tokenUrl="https://oauth2.googleapis.com/token",
    scopes={"openid": "OpenID Connect scope"},
)

# Create APIRouter instance
router = APIRouter()

# Helper function to simulate Google Login and Redirect
def generate_state():
    """Generate a random state string"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16))

@router.get("/auth/login", tags=["Authentication"])
async def login(request: Request):
    state = generate_state()
    request.session["state"] = state
    redirect_uri = {API_BASE_URL} + "/api/auth/callback"
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}"
        f"&scope=openid%20email%20profile&state={state}"
    )
    print("google_auth_url", google_auth_url);
    return RedirectResponse(google_auth_url) 

@router.get("/auth/callback", tags=["Authentication"])
async def callback(request: Request):
    state_received = request.query_params.get("state")
    state_stored = request.session.get("state")
    print(f"Received state: {state_received}, Stored state: {state_stored}")

    if state_received != state_stored:
        raise HTTPException(status_code=400, detail="State mismatch")

    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    # Exchange the code for tokens
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")  # Extract user info from the token
    if not user_info:
        raise HTTPException(status_code=400, detail="Missing user info in the token")

    # Create a JWT token for your application
    jwt_token = create_jwt(user_info)  # Implement your JWT creation logic here

    return {"access_token": jwt_token, "user_info": user_info}

# Protected Route
@router.get("/protected", tags=["Protected"], dependencies=[Depends(oauth2_scheme)])
async def protected():
    return {"message": "You are authenticated and can access this endpoint!"}

# Define your secret key and algorithm
JWT_SECRET = os.getenv("SECRET_KEY", "db11adfd7f008dcd8347e47fff1734bd77a59c80a4ad8ff2")
JWT_ALGORITHM = "HS256"

def create_jwt(user_info: dict):
    """Create a JWT token for the authenticated user."""
    payload = {
        "sub": user_info["email"],  # Use the user's email as the subject
        "name": user_info.get("name"),
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

@router.get("/test")
async def test_route():
    return {"message": "Test route is working"}