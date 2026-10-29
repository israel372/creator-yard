from copy import deepcopy
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.homepage_content import HomepageContent
from app.routes.video_portfolio_auth import require_video_portfolio_admin


router = APIRouter(tags=["Homepage CMS"])


class HomepageContentPayload(BaseModel):
    content: dict = Field(default_factory=dict)


def get_or_create_content(db: Session) -> HomepageContent:
    page = (
        db.query(HomepageContent)
        .order_by(HomepageContent.id.asc())
        .first()
    )

    if page is None:
        page = HomepageContent(
            content={"draft": {}, "published": {}},
            is_published=False,
        )
        db.add(page)
        db.commit()
        db.refresh(page)

    stored = page.content if isinstance(page.content, dict) else {}

    # Migrate any legacy unversioned content without discarding it.
    if "draft" not in stored and "published" not in stored:
        legacy_content = deepcopy(stored)
        page.content = {
            "draft": legacy_content,
            "published": legacy_content if page.is_published else {},
        }
        db.commit()
        db.refresh(page)

    return page


def content_versions(page: HomepageContent) -> dict:
    stored = page.content if isinstance(page.content, dict) else {}
    return {
        "draft": stored.get("draft", {}),
        "published": stored.get("published", {}),
    }


@router.get("/homepage/content")
def get_published_content(db: Session = Depends(get_db)):
    page = (
        db.query(HomepageContent)
        .filter(HomepageContent.is_published.is_(True))
        .order_by(HomepageContent.id.asc())
        .first()
    )

    if page is None:
        raise HTTPException(
            status_code=404,
            detail="No published homepage content",
        )

    published = content_versions(page)["published"]
    if not published:
        raise HTTPException(
            status_code=404,
            detail="No published homepage content",
        )

    return {
        "content": published,
        "is_published": True,
        "updated_at": page.updated_at,
    }


@router.get("/homepage/admin/content")
def get_admin_content(
    db: Session = Depends(get_db),
    _: bool = Depends(require_video_portfolio_admin),
):
    page = get_or_create_content(db)
    versions = content_versions(page)

    return {
        "content": versions["draft"],
        "published_content": versions["published"],
        "is_published": page.is_published,
        "updated_at": page.updated_at,
    }


@router.put("/homepage/admin/content")
def save_draft(
    payload: HomepageContentPayload,
    db: Session = Depends(get_db),
    _: bool = Depends(require_video_portfolio_admin),
):
    page = get_or_create_content(db)
    versions = content_versions(page)
    versions["draft"] = payload.content
    page.content = versions
    page.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(page)

    return {
        "message": "Homepage draft saved",
        "content": versions["draft"],
        "is_published": page.is_published,
        "updated_at": page.updated_at,
    }


@router.post("/homepage/admin/content/publish")
def publish_content(
    db: Session = Depends(get_db),
    _: bool = Depends(require_video_portfolio_admin),
):
    page = get_or_create_content(db)
    versions = content_versions(page)

    if not versions["draft"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot publish empty homepage content. Save a draft first.",
        )

    versions["published"] = deepcopy(versions["draft"])
    page.content = versions
    page.is_published = True
    page.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(page)

    return {
        "message": "Homepage content published",
        "content": versions["published"],
        "is_published": True,
        "updated_at": page.updated_at,
    }
