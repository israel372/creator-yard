
from sqlalchemy.orm import Session

from app.models.video_portfolio import VideoPortfolio
from app.schemas.video_portfolio_admin import (
    VideoPortfolioCreate,
    VideoPortfolioUpdate,
)


def list_published_videos(db: Session) -> list[VideoPortfolio]:
    return (
        db.query(VideoPortfolio)
        .filter(VideoPortfolio.is_published.is_(True))
        .order_by(
            VideoPortfolio.sort_order.asc(),
            VideoPortfolio.id.desc(),
        )
        .all()
    )


def list_all_videos(db: Session) -> list[VideoPortfolio]:
    return (
        db.query(VideoPortfolio)
        .order_by(
            VideoPortfolio.sort_order.asc(),
            VideoPortfolio.id.desc(),
        )
        .all()
    )


def create_video(
    db: Session,
    data: VideoPortfolioCreate,
) -> VideoPortfolio:
    video = VideoPortfolio(
        title=data.title,
        description=data.description,
        category=data.category,
        video_url=str(data.video_url),
        thumbnail_url=(
            str(data.thumbnail_url)
            if data.thumbnail_url
            else None
        ),
        sort_order=data.sort_order,
        is_published=data.is_published,
    )

    db.add(video)
    db.commit()
    db.refresh(video)
    return video


def update_video(
    db: Session,
    video: VideoPortfolio,
    data: VideoPortfolioUpdate,
) -> VideoPortfolio:
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if field in {"video_url", "thumbnail_url"} and value is not None:
            value = str(value)
        setattr(video, field, value)

    db.commit()
    db.refresh(video)
    return video


def delete_video(db: Session, video: VideoPortfolio) -> None:
    db.delete(video)
    db.commit()
