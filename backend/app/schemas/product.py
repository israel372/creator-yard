from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    name: str
    original_price: float = 0
    discount: float = 0
    price: float = 0
    description: str = ""
    link: str | None = None
    is_portfolio: bool = False


class ProductCreate(ProductBase):
    image: str | None = None


class ProductResponse(ProductBase):
    id: int
    image: str | None = None

    model_config = ConfigDict(from_attributes=True)