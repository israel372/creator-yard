from copy import deepcopy
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.retail_management_content import RetailManagementContent
from app.routes.video_portfolio_auth import require_video_portfolio_admin


router = APIRouter(tags=["Retail Management Page CMS"])


class PageContentPayload(BaseModel):
    content: dict = Field(default_factory=dict)


def get_or_create_content(db: Session) -> RetailManagementContent:
    page = (
        db.query(RetailManagementContent)
        .order_by(RetailManagementContent.id.asc())
        .first()
    )

    if page is None:
        page = RetailManagementContent(
            content={"draft": {}, "published": {}},
            is_published=False,
        )
        db.add(page)
        db.commit()
        db.refresh(page)

    stored = page.content if isinstance(page.content, dict) else {}

    # Preserve compatibility if a record ever contains legacy, unversioned content.
    if "draft" not in stored and "published" not in stored:
        legacy_content = deepcopy(stored)
        page.content = {
            "draft": legacy_content,
            "published": legacy_content if page.is_published else {},
        }
        db.commit()
        db.refresh(page)

    return page


def content_versions(page: RetailManagementContent) -> dict:
    stored = page.content if isinstance(page.content, dict) else {}
    return {
        "draft": stored.get("draft", {}),
        "published": stored.get("published", {}),
    }


@router.get("/retail-management/content")
def get_published_content(db: Session = Depends(get_db)):
    page = (
        db.query(RetailManagementContent)
        .filter(RetailManagementContent.is_published.is_(True))
        .order_by(RetailManagementContent.id.asc())
        .first()
    )

    if page is None:
        raise HTTPException(
            status_code=404,
            detail="No published retail management content",
        )

    versions = content_versions(page)

    if not versions["published"]:
        raise HTTPException(
            status_code=404,
            detail="No published retail management content",
        )

    return {
        "content": versions["published"],
        "is_published": True,
        "updated_at": page.updated_at,
    }


@router.get("/retail-management/admin/content")
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


@router.put("/retail-management/admin/content")
def save_draft(
    payload: PageContentPayload,
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
        "message": "Draft saved",
        "content": versions["draft"],
        "is_published": page.is_published,
        "updated_at": page.updated_at,
    }


@router.post("/retail-management/admin/content/publish")
def publish_content(
    db: Session = Depends(get_db),
    _: bool = Depends(require_video_portfolio_admin),
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
        "message": "Retail management page content published",
        "content": versions["published"],
        "is_published": True,
        "updated_at": page.updated_at,
    }
