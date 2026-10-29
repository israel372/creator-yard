from fastapi import APIRouter, Depends
import secrets
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes.user_accounts import require_permission
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileResponse
from fastapi import UploadFile, File
from app.services.upload_service import save_image
from fastapi.responses import Response
from fastapi import HTTPException


router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.post("/", response_model=ProfileResponse)
def save_profile(
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_profile")),
):

    

    # Check if a profile already exists
    existing_profile = db.query(Profile).first()

    if existing_profile:
        # Update existing profile
        existing_profile.store_name = profile.store_name
        existing_profile.logo_type = profile.logo_type

        existing_profile.facebook = profile.facebook
        existing_profile.instagram = profile.instagram
        existing_profile.tiktok = profile.tiktok
        existing_profile.twitter = profile.twitter

        existing_profile.email = profile.email
        existing_profile.phone = profile.phone
        existing_profile.address = profile.address
        existing_profile.whatsapp = profile.whatsapp

        existing_profile.ceo_name = profile.ceo_name
        existing_profile.tagline = profile.tagline
        existing_profile.description = profile.description

        db.commit()
        db.refresh(existing_profile)

        return existing_profile

    # Create new profile
    new_profile = Profile(
        profile_token=secrets.token_urlsafe(32),
        store_name=profile.store_name,
        logo_type=profile.logo_type,

        facebook=profile.facebook,
        instagram=profile.instagram,
        tiktok=profile.tiktok,
        twitter=profile.twitter,
        email=profile.email,
        phone=profile.phone,
        address=profile.address,
        whatsapp=profile.whatsapp,

        ceo_name=profile.ceo_name,
        tagline=profile.tagline,
        description=profile.description,
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.post("/logo")
def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_profile")),
):
    # Upload to Supabase
    image = save_image(file, folder="logos")

    # Find existing profile
    profile = db.query(Profile).first()

    if profile:
        profile.logo = image["url"]

        db.commit()
        db.refresh(profile)

    else:
        profile = Profile(
            store_name="",
            logo_type="image",
            logo=image["url"],
            hero_image="",
            facebook="",
            instagram="",
            tiktok="",
            twitter="",
            email="",
            phone="",
            address="",
            whatsapp="",
            ceo_name="",
            tagline="",
            description="",
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "message": "Logo uploaded successfully",
        "url": image["url"],
    }




@router.post("/hero")
def upload_hero(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_profile")),
):
    image = save_image(file, folder="hero")

    profile = db.query(Profile).first()

    if not profile:
        profile = Profile(
            store_name="",
            logo_type="text",
            logo="",
            hero_image="",
            facebook="",
            instagram="",
            tiktok="",
            twitter="",
            email="",
            phone="",
            address="",
            whatsapp="",
            ceo_name="",
            tagline="",
            description="",
        )

        db.add(profile)

    # SAVE ONLY THE SUPABASE URL
    profile.hero_image = image["url"]

    db.commit()
    db.refresh(profile)

    return {
        "message": "Hero image uploaded successfully",
        "url": image["url"],
    }  




@router.get("/", response_model=ProfileResponse)
def get_current_profile(
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile

@router.get("/contact")
def download_contact(db: Session = Depends(get_db)):

    profile = db.query(Profile).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Change this to your real website
    website = "http://127.0.0.1:5173"

    hero = ""

    if profile.hero_image:
        hero = profile.hero_image

    vcard = f"""BEGIN:VCARD
VERSION:3.0
FN:{profile.store_name}
ORG:{profile.store_name}
TITLE:{profile.ceo_name}
TEL;TYPE=CELL:{profile.phone}
EMAIL:{profile.email}
ADR:;;{profile.address}
URL:{website}
PHOTO;VALUE=URI:{hero}
NOTE:{profile.description}
END:VCARD
"""

    return Response(
        content=vcard,
        media_type="text/vcard",
        headers={
            "Content-Disposition": f'attachment; filename="{profile.store_name}.vcf"'
        },
    )



@router.get("/{profile_token}", response_model=ProfileResponse)
def get_profile(
    profile_token: str,
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(
        Profile.profile_token == profile_token
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile



@router.put("/{profile_token}", response_model=ProfileResponse)
def update_profile(
    profile_token: str,
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_profile")),
):
    existing_profile = db.query(Profile).filter(
        Profile.profile_token == profile_token
    ).first()

    if not existing_profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found for this token"
        )

    # Update editable profile details only.
    # Keep the existing logo and hero image unchanged.
    existing_profile.store_name = profile.store_name
    existing_profile.logo_type = profile.logo_type

    existing_profile.facebook = profile.facebook
    existing_profile.instagram = profile.instagram
    existing_profile.tiktok = profile.tiktok
    existing_profile.twitter = profile.twitter

    existing_profile.email = profile.email
    existing_profile.phone = profile.phone
    existing_profile.address = profile.address
    existing_profile.whatsapp = profile.whatsapp

    existing_profile.ceo_name = profile.ceo_name
    existing_profile.tagline = profile.tagline
    existing_profile.description = profile.description

    db.commit()
    db.refresh(existing_profile)

    return existing_profile
