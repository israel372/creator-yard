import base64
import hashlib
import secrets


def generate_session_token() -> str:
    """Generate a cryptographically secure session token."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Hash a session token before storing it in the database."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_password(
    password: str,
    salt: bytes,
    expected_hash: bytes,
) -> bool:
    """Verify a password against a stored PBKDF2 hash."""
    actual_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        600_000,
    )
    return secrets.compare_digest(actual_hash, expected_hash)


def hash_password(password: str) -> dict:
    """Create a salted PBKDF2 password hash."""
    if not isinstance(password, str) or len(password) < 12:
        raise ValueError("Password must contain at least 12 characters.")

    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        600_000,
    )

    return {
        "password_salt": base64.b64encode(salt).decode("ascii"),
        "password_hash": base64.b64encode(password_hash).decode("ascii"),
        "algorithm": "pbkdf2_sha256",
        "iterations": 600_000,
    }