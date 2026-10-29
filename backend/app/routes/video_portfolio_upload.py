
from fastapi import APIRouter, Depends, File, UploadFile

from app.routes.user_accounts import require_permission
from app.services.video_portfolio_upload_service import save_video_locally

router = APIRouter(
    prefix="/video-portfolio/admin",
    tags=["Video Portfolio Upload"],
)


@router.post("/upload")
async def upload_portfolio_video(
    file: UploadFile = File(...),
    _: bool = Depends(require_permission("manage_video_portfolio")),
):
    return await save_video_locally(file)
