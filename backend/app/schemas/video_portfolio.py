from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VideoPortfolioResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    video_url: str
    thumbnail_url: str | None = None
    sort_order: int
    is_published: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
