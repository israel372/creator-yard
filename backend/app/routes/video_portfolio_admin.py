
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.video_portfolio import VideoPortfolio
from app.schemas.video_portfolio import VideoPortfolioResponse
from app.schemas.video_portfolio_admin import (
    VideoPortfolioCreate,
    VideoPortfolioUpdate,
)
from app.services import video_portfolio_service
from app.routes.user_accounts import require_permission

router = APIRouter(
    prefix="/video-portfolio/admin",
    tags=["Video Portfolio Admin"],
)


@router.get("/", response_model=list[VideoPortfolioResponse])
def list_videos(
    db: Session = Depends(get_db),
    _: bool = Depends(require_permission("manage_video_portfolio")),
):
    return video_portfolio_service.list_all_videos(db)


@router.post(
    "/",
    response_model=VideoPortfolioResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_video(
    payload: VideoPortfolioCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_permission("manage_video_portfolio")),
):
    return video_portfolio_service.create_video(db, payload)


@router.patch("/{video_id}", response_model=VideoPortfolioResponse)
def update_video(
    video_id: int,
    payload: VideoPortfolioUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_permission("manage_video_portfolio")),
):
    video = db.get(VideoPortfolio, video_id)
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")

    return video_portfolio_service.update_video(db, video, payload)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_permission("manage_video_portfolio")),
):
    video = db.get(VideoPortfolio, video_id)
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")

    video_portfolio_service.delete_video(db, video)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
