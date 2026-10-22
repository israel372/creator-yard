from pydantic import BaseModel


class ProfileBase(BaseModel):
    store_name: str
    logo_type: str

    facebook: str = ""
    instagram: str = ""
    tiktok: str = ""
    twitter: str = ""

    email: str = ""
    phone: str = ""
    address: str = ""
    whatsapp: str = ""

    ceo_name: str = ""
    tagline: str = ""
    description: str = ""


class ProfileCreate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: int
    logo: str | None = None
    hero_image: str | None = None
    profile_token: str | None = None

    class Config:
        from_attributes = True

