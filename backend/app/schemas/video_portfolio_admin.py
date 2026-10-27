
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class VideoPortfolioCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=10000)
    category: str = Field(default="Video Production", min_length=1, max_length=100)
    video_url: HttpUrl
    thumbnail_url: HttpUrl | None = None
    sort_order: int = Field(default=0, ge=0)
    is_published: bool = False


class VideoPortfolioUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    video_url: HttpUrl | None = None
    thumbnail_url: HttpUrl | None = None
    sort_order: int | None = Field(default=None, ge=0)
    is_published: bool | None = None

    model_config = ConfigDict(extra="forbid")


class VideoPortfolioPublish(BaseModel):
    is_published: bool
