from copy import deepcopy
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.video_production_content import VideoProductionContent
from app.routes.user_accounts import require_permission

router = APIRouter(tags=["Video Production Page CMS"])


class PageContentPayload(BaseModel):
    content: dict = Field(default_factory=dict)


def get_or_create_content(db: Session) -> VideoProductionContent:
    page = (
        db.query(VideoProductionContent)
        .order_by(VideoProductionContent.id.asc())
        .first()
    )

    if page is None:
        page = VideoProductionContent(
            content={"draft": {}, "published": {}},
            is_published=False,
        )
        db.add(page)
        db.commit()
        db.refresh(page)

    # Keep compatibility with any record created by the earlier API version.
    stored = page.content if isinstance(page.content, dict) else {}
    if "draft" not in stored and "published" not in stored:
        legacy_content = deepcopy(stored)
        page.content = {
            "draft": legacy_content,
            "published": legacy_content if page.is_published else {},
        }
        db.commit()
        db.refresh(page)

    return page


def content_versions(page: VideoProductionContent) -> dict:
    stored = page.content if isinstance(page.content, dict) else {}
    return {
        "draft": stored.get("draft", {}),
        "published": stored.get("published", {}),
    }


@router.get("/video-production/content")
def get_published_content(db: Session = Depends(get_db)):
    page = (
        db.query(VideoProductionContent)
        .filter(VideoProductionContent.is_published.is_(True))
        .order_by(VideoProductionContent.id.asc())
        .first()
    )

    if page is None:
        raise HTTPException(
            status_code=404,
            detail="No published page content",
        )

    versions = content_versions(page)
    if not versions["published"]:
        raise HTTPException(
            status_code=404,
            detail="No published page content",
        )

    return {
        "content": versions["published"],
        "is_published": True,
        "updated_at": page.updated_at,
    }


@router.get("/video-production/admin/content")
def get_admin_content(
    db: Session = Depends(get_db),
    _: bool = Depends(require_permission("manage_video_content")),
):
    page = get_or_create_content(db)
    versions = content_versions(page)

    return {
        "content": versions["draft"],
        "published_content": versions["published"],
        "is_published": page.is_published,
        "updated_at": page.updated_at,
    }


@router.put("/video-production/admin/content")
def save_draft(
    payload: PageContentPayload,
    db: Session = Depends(get_db),
    _: bool = Depends(require_permission("manage_video_content")),
):
    page = get_or_create_content(db)
    versions = content_versions(page)
    versions["draft"] = payload.content
    page.content = versions
    page.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(page)

    return {
        "message": "Draft saved",
        "content": versions["draft"],
        "is_published": page.is_published,
        "updated_at": page.updated_at,
    }


@router.post("/video-production/admin/content/publish")
def publish_content(
    db: Session = Depends(get_db),
    _: bool = Depends(require_permission("manage_video_content")),
):
    page = get_or_create_content(db)
    versions = content_versions(page)

    if not versions["draft"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot publish empty page content. Save a draft first.",
        )

    versions["published"] = deepcopy(versions["draft"])
    page.content = versions
    page.is_published = True
    page.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(page)

    return {
        "message": "Page content published",
        "content": versions["published"],
        "is_published": True,
        "updated_at": page.updated_at,
    }
