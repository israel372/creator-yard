from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, JSON

from app.database import Base


class HomepageContent(Base):
    __tablename__ = "homepage_content"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(
        JSON,
        nullable=False,
        default=lambda: {"draft": {}, "published": {}},
    )
    is_published = Column(Boolean, nullable=False, default=False)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
