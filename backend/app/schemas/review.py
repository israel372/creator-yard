
from pydantic import BaseModel

class ReviewCreate(BaseModel):
    customer_name: str
    comment: str
    rating: int


class ReviewResponse(ReviewCreate):
    id: int

    class Config:
        from_attributes = True