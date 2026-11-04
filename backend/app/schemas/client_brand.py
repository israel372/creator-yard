from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientBrandBase(BaseModel):
    name: str
    description: str = ""
    website: str | None = None
    contact_url: str | None = None
    logo: str | None = None
    is_published: bool = False


class ClientBrandCreate(ClientBrandBase):
    pass


class ClientBrandResponse(ClientBrandBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
