from sqlalchemy import Column, Integer, String, Float, Text, Boolean
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    original_price = Column(Float)
    discount = Column(Float, default=0)
    price = Column(Float)
    description = Column(Text)
    image = Column(String, nullable=True)

    # New fields for agency client brands.
    # Existing shop products remain non-portfolio records.
    link = Column(String, nullable=True)
    is_portfolio = Column(Boolean, nullable=False, default=False)