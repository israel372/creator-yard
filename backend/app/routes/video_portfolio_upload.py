
from fastapi import APIRouter, Depends, File, UploadFile

from app.routes.video_portfolio_auth import require_video_portfolio_admin
from app.services.video_portfolio_upload_service import save_video_locally

router = APIRouter(
    prefix="/video-portfolio/admin",
    tags=["Video Portfolio Upload"],
)


@router.post("/upload")
async def upload_portfolio_video(
    file: UploadFile = File(...),
    _: bool = Depends(require_video_portfolio_admin),
):
    return await save_video_locally(file)
