from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes.user_accounts import get_current_user
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse
from app.services.upload_service import save_image

router = APIRouter(prefix="/products", tags=["Products"])

def authorize_product_write(current_user, is_portfolio: bool):
    if current_user.role == "owner":
        return
    permission = "manage_clients" if is_portfolio else "manage_products"
    if (current_user.permissions or {}).get(permission) is not True:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to perform this action.",
        )


@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    authorize_product_write(current_user, product.is_portfolio)
    new_product = Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Record not found")

    authorize_product_write(current_user, db_product.is_portfolio)
    if product.is_portfolio != db_product.is_portfolio:
        raise HTTPException(
            status_code=400,
            detail="Record type cannot be changed through this endpoint.",
        )

    for field, value in product.model_dump().items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)

    return db_product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Record not found")

    authorize_product_write(current_user, db_product.is_portfolio)
    db.delete(db_product)
    db.commit()

    return {"message": "Record deleted successfully"}


@router.post("/upload")
def upload_product_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    if current_user.role != "owner":
        permissions = current_user.permissions or {}
        if not any(permissions.get(key) is True for key in ("manage_clients", "manage_products")):
            raise HTTPException(status_code=403, detail="You do not have permission to upload product images.")
    image = save_image(file, folder="products")

    return {
        "message": "Image uploaded successfully",
        "url": image["url"],
    }