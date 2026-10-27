
import os
import hmac
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

router = APIRouter(prefix="/video-portfolio/admin", tags=["Video Portfolio Admin Auth"])

bearer_scheme = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
TOKEN_LIFETIME_MINUTES = 30


class AdminLoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=200)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def get_jwt_secret() -> str:
    secret = os.getenv("VIDEO_PORTFOLIO_JWT_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Video portfolio admin authentication is not configured.",
        )
    return secret


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest):
    configured_password = os.getenv("VIDEO_PORTFOLIO_ADMIN_PASSWORD", "")

    if not configured_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Video portfolio admin login is not configured.",
        )

    if not hmac.compare_digest(payload.password, configured_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password.",
        )

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=TOKEN_LIFETIME_MINUTES)

    token = jwt.encode(
        {
            "sub": "video-portfolio-admin",
            "iat": now,
            "exp": expires_at,
        },
        get_jwt_secret(),
        algorithm=JWT_ALGORITHM,
    )

    return AdminLoginResponse(
        access_token=token,
        expires_in=TOKEN_LIFETIME_MINUTES * 60,
    )


def require_video_portfolio_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "iat", "exp"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("sub") != "video-portfolio-admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token.",
        )

    return True
