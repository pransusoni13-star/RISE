from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from threading import BoundedSemaphore
from fastapi import HTTPException

import jwt
from pwdlib import PasswordHash

from .config import get_settings


password_hash = PasswordHash.recommended()
password_slots = BoundedSemaphore(2)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    if not password_slots.acquire(blocking=False):
        raise HTTPException(503, "Account service is busy. Please retry shortly.", headers={"Retry-After": "2"})
    try:
        return password_hash.hash(password)
    finally:
        password_slots.release()


def verify_password(password: str, hashed: str) -> bool:
    if not password_slots.acquire(blocking=False):
        raise HTTPException(503, "Account service is busy. Please retry shortly.", headers={"Retry-After": "2"})
    try:
        return password_hash.verify(password, hashed)
    finally:
        password_slots.release()


def hash_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: str, session_id: str, authenticated_at: datetime) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": user_id, "sid": session_id, "auth_time": int(authenticated_at.timestamp()), "iat": now, "exp": now + timedelta(minutes=settings.access_token_minutes), "type": "access", "iss": "rise-api", "aud": "rise-client"},
        settings.jwt_secret,
        algorithm="HS256",
    )


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"], issuer="rise-api", audience="rise-client", options={"require": ["exp", "iat", "sub", "sid", "auth_time", "iss", "aud", "type"]})
    if payload.get("type") != "access" or any(not isinstance(payload.get(key), str) or not payload[key] for key in ("sub", "sid")) or type(payload.get("auth_time")) is not int:
        raise jwt.InvalidTokenError("Invalid token type")
    if payload["auth_time"] > datetime.now(timezone.utc).timestamp() + 30:
        raise jwt.InvalidTokenError("Invalid authentication time")
    return payload


def create_refresh_token() -> str:
    return token_urlsafe(48)
