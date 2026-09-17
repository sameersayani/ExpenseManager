# app/auth_mobile.py
import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field

from app.models import UserInfo

router = APIRouter(prefix="/api/mobile/auth", tags=["Mobile Authentication"])

# ====================== CONFIG ======================
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

if not GOOGLE_CLIENT_ID or not JWT_SECRET:
    raise RuntimeError("GOOGLE_CLIENT_ID and SECRET_KEY environment variables are required")

security = HTTPBearer(auto_error=True)


# ====================== SCHEMAS ======================
class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., description="Google ID Token received from mobile Google Sign-In SDK")


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# ====================== HELPERS ======================
def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    payload.update({"exp": expire})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_google_token(token: str) -> dict:
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
        if idinfo.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Invalid issuer")
        return idinfo
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google ID token: {str(e)}",
        )


async def get_or_create_user(email: str, name: str = None, picture: str = None) -> UserInfo:
    user = await UserInfo.get_or_none(email=email)
    if user:
        return user
    return await UserInfo.create(email=email, createdby=email)


# ====================== DEPENDENCY (for protected routes) ======================
async def get_current_mobile_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# ====================== ENDPOINTS ======================

@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Mobile Login with Google",
    description="Send Google ID Token from mobile app. Returns JWT access token.",
)
async def mobile_google_login(body: GoogleLoginRequest):
    """
    Pure mobile login endpoint.
    
    Mobile app flow:
    1. User signs in with Google Sign-In SDK
    2. App receives idToken
    3. App sends idToken to this endpoint
    4. Backend verifies token → creates/finds user → returns JWT
    """
    google_user = verify_google_token(body.id_token)

    email = google_user.get("email")
    name = google_user.get("name")
    picture = google_user.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Email not present in Google token")

    user_info = await get_or_create_user(email=email, name=name, picture=picture)

    access_token = create_access_token(
        {
            "sub": email,
            "user_id": user_info.id,
            "name": name,
            "picture": picture,
        }
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=JWT_EXPIRE_DAYS * 24 * 3600,
        user=UserResponse(
            id=user_info.id,
            email=email,
            name=name,
            picture=picture,
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current mobile user",
)
async def get_current_user(current_user: dict = Depends(get_current_mobile_user)):
    """
    Returns the currently authenticated mobile user.
    Requires: Authorization: Bearer <access_token>
    """
    return UserResponse(
        id=current_user.get("user_id"),
        email=current_user.get("sub"),
        name=current_user.get("name"),
        picture=current_user.get("picture"),
    )