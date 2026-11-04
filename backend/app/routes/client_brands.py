from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client_brand import ClientBrand
from app.routes.user_accounts import get_current_user
from app.schemas.client_brand import ClientBrandCreate, ClientBrandResponse
from app.services.upload_service import save_image

router = APIRouter(prefix="/client-brands", tags=["Client Brands"])


def authorize_client_brand_write(current_user):
    if current_user.role == "owner":
        return

    if (current_user.permissions or {}).get("manage_clients") is not True:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to manage client brands.",
        )


@router.get("/", response_model=list[ClientBrandResponse])
def get_published_client_brands(db: Session = Depends(get_db)):
    return (
        db.query(ClientBrand)
        .filter(ClientBrand.is_published.is_(True))
        .order_by(ClientBrand.created_at.desc())
        .all()
    )


@router.get("/manage", response_model=list[ClientBrandResponse])
def get_client_brands_for_management(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    authorize_client_brand_write(current_user)
    return db.query(ClientBrand).order_by(ClientBrand.created_at.desc()).all()


@router.post("/", response_model=ClientBrandResponse)
def create_client_brand(
    brand: ClientBrandCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    authorize_client_brand_write(current_user)

    data = brand.model_dump()
    data["name"] = data["name"].strip()

    if not data["name"]:
        raise HTTPException(status_code=422, detail="Brand name is required.")

    new_brand = ClientBrand(**data)
    db.add(new_brand)
    db.commit()
    db.refresh(new_brand)
    return new_brand


@router.put("/{brand_id}", response_model=ClientBrandResponse)
def update_client_brand(
    brand_id: int,
    brand: ClientBrandCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    authorize_client_brand_write(current_user)

    db_brand = db.query(ClientBrand).filter(ClientBrand.id == brand_id).first()
    if not db_brand:
        raise HTTPException(status_code=404, detail="Client brand not found.")

    data = brand.model_dump()
    data["name"] = data["name"].strip()

    if not data["name"]:
        raise HTTPException(status_code=422, detail="Brand name is required.")

    for field, value in data.items():
        setattr(db_brand, field, value)

    db.commit()
    db.refresh(db_brand)
    return db_brand


@router.delete("/{brand_id}")
def delete_client_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    authorize_client_brand_write(current_user)

    db_brand = db.query(ClientBrand).filter(ClientBrand.id == brand_id).first()
    if not db_brand:
        raise HTTPException(status_code=404, detail="Client brand not found.")

    db.delete(db_brand)
    db.commit()
    return {"message": "Client brand deleted successfully."}


@router.post("/upload")
def upload_client_brand_logo(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    authorize_client_brand_write(current_user)

    image = save_image(file, folder="client-brands")
    return {
        "message": "Client brand logo uploaded successfully.",
        "url": image["url"],
    }
