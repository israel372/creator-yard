from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    comment = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)