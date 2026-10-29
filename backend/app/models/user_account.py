from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from app.database import Base


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(150), nullable=False)
    email = Column(String(254), unique=True, index=True, nullable=False)
    phone = Column(String(40), nullable=False)
    password_hash = Column(String(255), nullable=False)

    # Roles and account status are assigned and enforced by the backend.
    role = Column(String(20), nullable=False, default="staff", index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)

    # Examples: manage_clients, manage_products, view_reports.
    permissions = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    approved_at = Column(DateTime, nullable=True)
    approved_by_id = Column(
        Integer,
        ForeignKey("user_accounts.id"),
        nullable=True,
    )

    last_login_at = Column(DateTime, nullable=True)
