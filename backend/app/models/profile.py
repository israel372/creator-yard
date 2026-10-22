from sqlalchemy import Column, Integer, String

from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)

    profile_token = Column(String, unique=True, nullable=True, index=True)

    store_name = Column(String)

    logo_type = Column(String)

    logo = Column(String)

    hero_image = Column(String)

    facebook = Column(String)

    instagram = Column(String)

    tiktok = Column(String)

    twitter = Column(String)

    address = Column(String, nullable=True)

    email = Column(String, default="")

    phone = Column(String, default="")

    whatsapp = Column(String, default="")

    ceo_name = Column(String, default="")

    tagline = Column(String, default="")

    description = Column(String, default="")

    