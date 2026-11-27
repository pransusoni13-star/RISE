"""Atomic, shared fixed-window quotas on the existing application database."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from threading import Lock
from time import monotonic

from fastapi import HTTPException
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .models import RequestBudget

_cleanup_lock = Lock()
_last_cleanup = 0.0


def enforce_budgets(db: Session, limits: list[tuple[str, int, int, int]]) -> None:
    """Call before domain mutations: successful reservations commit independently.

    Each tuple is (subject, limit, window seconds, cost). No email/IP is stored in
    plaintext. Rejected reservations roll back the whole batch. SQL upserts make
    quotas effective across processes and restarts, including concurrent requests.
    """
    global _last_cleanup
    now = datetime.now(timezone.utc)
    stamp = int(now.timestamp())
    dialect = db.get_bind().dialect.name
    insert = pg_insert if dialect == "postgresql" else sqlite_insert
    try:
        for subject, limit, seconds, cost in limits:
            if cost <= 0:
                continue
            window = stamp // seconds
            key = f"{sha256(subject.encode()).hexdigest()}:{window}"
            expiry = datetime.fromtimestamp((window + 1) * seconds, timezone.utc)
            if cost > limit:
                raise HTTPException(429, "Activity limit reached. Please try later.", headers={"Retry-After": str(max(1, int((expiry - now).total_seconds())))})
            statement = insert(RequestBudget).values(key=key, used=cost, expires_at=expiry)
            statement = statement.on_conflict_do_update(index_elements=[RequestBudget.key], set_={"used": RequestBudget.used + cost}, where=RequestBudget.used + cost <= limit).returning(RequestBudget.used)
            if db.scalar(statement) is None:
                raise HTTPException(429, "Activity limit reached. Please try later.", headers={"Retry-After": str(max(1, int((expiry - now).total_seconds())))})
        with _cleanup_lock:
            if monotonic() - _last_cleanup > 300:
                db.execute(delete(RequestBudget).where(RequestBudget.expires_at < now - timedelta(days=1)))
                _last_cleanup = monotonic()
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Service temporarily unavailable") from exc
