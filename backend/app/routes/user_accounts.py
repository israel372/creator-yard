import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user_account import UserAccount


router = APIRouter(prefix="/accounts", tags=["User Accounts"])

password_hasher = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 30


class RegistrationRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=7, max_length=40)
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_jwt_secret() -> str:
    secret = os.getenv("CREATOR_YARD_AUTH_JWT_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account authentication is not configured yet.",
        )
    return secret


def public_account(user: UserAccount) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "status": user.status,
        "permissions": user.permissions or {},
        "created_at": user.created_at,
        "approved_at": user.approved_at,
    }


def create_access_token(user: UserAccount) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "creator-yard-account",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserAccount:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            get_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
        )
        if payload.get("type") != "creator-yard-account":
            raise ValueError("Wrong token type")
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired sign-in token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()

    if user is None or user.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not approved or is no longer active.",
        )

    return user


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_account(
    data: RegistrationRequest,
    db: Session = Depends(get_db),
):
    full_name = data.full_name.strip()
    email = data.email.strip().lower()
    phone = data.phone.strip()

    if len(full_name) < 2 or not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enter a valid name and email address.",
        )

    existing = db.query(UserAccount).filter(
        UserAccount.email == email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = UserAccount(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=password_hasher.hash(data.password),
        role="staff",
        status="pending",
        permissions={},
    )

    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    return {
        "message": "Registration received. Your account is pending owner approval.",
        "account": public_account(user),
    }


@router.post("/login")
def login_account(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    email = data.email.strip().lower()
    user = db.query(UserAccount).filter(
        UserAccount.email == email
    ).first()

    if user is None or not password_hasher.verify(
        data.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if user.status != "approved":
        messages = {
            "pending": "Your account is awaiting owner approval.",
            "rejected": "Your account registration was rejected.",
            "suspended": "Your account is suspended. Contact the owner.",
        }
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=messages.get(
                user.status,
                "Your account is not approved. Contact the owner.",
            ),
        )

    user.last_login_at = datetime.utcnow()
    db.commit()

    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_MINUTES * 60,
        "user": public_account(user),
    }


@router.get("/me")
def get_my_account(
    current_user: UserAccount = Depends(get_current_user),
):
    return public_account(current_user)

# --- Controlled first-Owner setup and account administration ---
import hmac
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

ALLOWED_PERMISSIONS = {
    "manage_clients",
    "manage_products",
    "manage_profile",
    "manage_reviews",
    "manage_video_portfolio",
    "manage_video_content",
    "view_reports",
}


class OwnerSetupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=7, max_length=40)
    password: str = Field(min_length=12, max_length=128)
    setup_key: str = Field(min_length=32, max_length=256)


class AccountAccessUpdate(BaseModel):
    role: str
    status: str
    permissions: dict[str, bool] = Field(default_factory=dict)



def require_permission(permission: str):
    """Create a dependency that enforces an account permission."""
    if permission not in ALLOWED_PERMISSIONS:
        raise ValueError("Unknown Creator Yard permission.")

    def permission_dependency(
        current_user: UserAccount = Depends(get_current_user),
    ) -> UserAccount:
        if current_user.role == "owner":
            return current_user

        permissions = current_user.permissions or {}
        if permissions.get(permission) is not True:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )

        return current_user

    return permission_dependency

def require_owner(
    current_user: UserAccount = Depends(get_current_user),
) -> UserAccount:
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Owner can manage user accounts.",
        )
    return current_user


@router.post("/setup-owner", status_code=status.HTTP_201_CREATED)
def setup_first_owner(
    data: OwnerSetupRequest,
    db: Session = Depends(get_db),
):
    # Validate both secrets/configuration before starting a database transaction.
    configured_key = os.getenv("CREATOR_YARD_OWNER_SETUP_KEY", "")
    get_jwt_secret()

    if len(configured_key) < 32 or not hmac.compare_digest(
        data.setup_key, configured_key
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner setup is not authorized.",
        )

    email = data.email.strip().lower()
    full_name = data.full_name.strip()
    phone = data.phone.strip()

    if len(full_name) < 2 or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enter a valid name and email address.",
        )

    try:
        # Serialize first-owner setup attempts in the SQLite development DB.
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")

        if db.query(UserAccount).filter(
            UserAccount.role == "owner"
        ).first():
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An Owner account already exists. Setup is closed.",
            )

        if db.query(UserAccount).filter(
            UserAccount.email == email
        ).first():
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = UserAccount(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=password_hasher.hash(data.password),
            role="owner",
            status="approved",
            permissions={
                permission: True for permission in ALLOWED_PERMISSIONS
            },
            approved_at=datetime.utcnow(),
        )

        db.add(user)
        db.flush()

        # Generate the token before committing, so configuration errors
        # cannot leave a created account with no sign-in response.
        access_token = create_access_token(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "Owner account created. Keep your sign-in details secure.",
            "user": public_account(user),
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_MINUTES * 60,
        }

    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    except Exception:
        db.rollback()
        raise

@router.get("/users")
def list_accounts(
    owner: UserAccount = Depends(require_owner),
    db: Session = Depends(get_db),
):
    users = db.query(UserAccount).order_by(UserAccount.created_at.desc()).all()
    return {"accounts": [public_account(user) for user in users]}


@router.get("/pending")
def list_pending_accounts(
    owner: UserAccount = Depends(require_owner),
    db: Session = Depends(get_db),
):
    users = db.query(UserAccount).filter(
        UserAccount.status == "pending"
    ).order_by(UserAccount.created_at.asc()).all()
    return {"accounts": [public_account(user) for user in users]}


@router.patch("/{user_id}/access")
def update_account_access(
    user_id: int,
    data: AccountAccessUpdate,
    owner: UserAccount = Depends(require_owner),
    db: Session = Depends(get_db),
):
    if data.role not in {"manager", "staff"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be manager or staff.",
        )

    if data.status not in {"approved", "rejected", "suspended"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Status must be approved, rejected, or suspended.",
        )

    unknown_permissions = set(data.permissions) - ALLOWED_PERMISSIONS
    if unknown_permissions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="One or more permissions are not recognized.",
        )

    user = db.query(UserAccount).filter(
        UserAccount.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    # The Owner cannot be changed through the staff/manager endpoint.
    if user.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner accounts cannot be changed through this endpoint.",
        )

    user.role = data.role
    user.status = data.status
    user.permissions = {
        permission: bool(enabled)
        for permission, enabled in data.permissions.items()
    }

    if data.status == "approved" and user.approved_at is None:
        user.approved_at = datetime.utcnow()
        user.approved_by_id = owner.id

    db.commit()
    db.refresh(user)

    return {
        "message": "Account access updated.",
        "account": public_account(user),
    }
