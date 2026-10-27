from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
)

from app.database import Base


class VideoPortfolio(Base):
    __tablename__ = "video_portfolio"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False, default="")
    category = Column(String(100), nullable=False, default="Video Production")

    video_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text, nullable=True)

    sort_order = Column(Integer, nullable=False, default=0)
    is_published = Column(Boolean, nullable=False, default=False)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
