
import os
import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

# Store files relative to this backend service, not the shell's working directory.
BACKEND_ROOT = Path(__file__).resolve().parents[2]
VIDEO_STORAGE_DIR = BACKEND_ROOT / "app" / "uploads" / "videos"

MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB

ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}


async def save_video_locally(file: UploadFile) -> dict:
    content_type = (file.content_type or "").lower()
    extension = ALLOWED_VIDEO_TYPES.get(content_type)

    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported video type. Upload MP4, WebM, or MOV.",
        )

    VIDEO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    destination = VIDEO_STORAGE_DIR / filename
    total_bytes = 0

    try:
        with destination.open("xb") as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break

                total_bytes += len(chunk)
                if total_bytes > MAX_VIDEO_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Video exceeds the 100 MB upload limit.",
                    )

                output.write(chunk)

        if total_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded video is empty.",
            )

        return {
            "filename": filename,
            "path": str(destination),
            "url": f"/uploads/videos/{filename}",
            "size_bytes": total_bytes,
            "content_type": content_type,
        }

    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
