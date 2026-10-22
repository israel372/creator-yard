from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


# ==========================
# Get all reviews
# ==========================
@router.get("/", response_model=list[ReviewResponse])
def get_reviews(db: Session = Depends(get_db)):
    return db.query(Review).all()


# ==========================
# Create review
# ==========================
@router.post("/", response_model=ReviewResponse)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    new_review = Review(
        customer_name=review.customer_name,
        comment=review.comment,
        rating=review.rating,
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


# ==========================
# Update review
# ==========================
@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review: ReviewCreate,
    db: Session = Depends(get_db)
):
    existing_review = db.query(Review).filter(Review.id == review_id).first()

    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")

    existing_review.customer_name = review.customer_name
    existing_review.comment = review.comment
    existing_review.rating = review.rating

    db.commit()
    db.refresh(existing_review)

    return existing_review


# ==========================
# Delete review
# ==========================
@router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()

    return {"message": "Review deleted successfully"}