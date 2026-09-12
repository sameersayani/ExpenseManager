from fastapi import Depends, HTTPException, Security
import requests

from app.main import AUTH_SERVICE_URL

def get_current_user(token: str = Security(...)):
    response = requests.get(f"{AUTH_SERVICE_URL}/me", headers={"Authorization": f"Bearer {token}"})
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Token")
    return response.json()
