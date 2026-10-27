from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.video_portfolio import VideoPortfolio
from app.schemas.video_portfolio import VideoPortfolioResponse


router = APIRouter(
    prefix="/video-portfolio",
    tags=["Video Portfolio"],
)


@router.get("/", response_model=list[VideoPortfolioResponse])
def get_published_videos(db: Session = Depends(get_db)):
    return (
        db.query(VideoPortfolio)
        .filter(VideoPortfolio.is_published.is_(True))
        .order_by(
            VideoPortfolio.sort_order.asc(),
            VideoPortfolio.id.desc(),
        )
        .all()
    )
