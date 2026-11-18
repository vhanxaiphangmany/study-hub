from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_access_token, verify_password, ADMIN_PASSWORD_HASH
from app.schemas import Token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != settings.ADMIN_USERNAME or not verify_password(form.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect username or password")
    return Token(access_token=create_access_token(form.username))


@router.get("/me")
async def me():
    return {"username": settings.ADMIN_USERNAME}
