from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app.models.video_production_content import VideoProductionContent
from app.routes import video_production_content
from app.routes import (
    profile, product, review, referral, video_portfolio,
    video_portfolio_admin, video_portfolio_auth, video_portfolio_upload,

)

BACKEND_ROOT = Path(__file__).resolve().parent.parent



app = FastAPI(
    title="Creator Yard API",
    description=(
        "Manage Creator Yard's portfolio, services, "
        "client brands, training content, and business profile."
    ),
    version="1.0.0"
)

app.mount(
    "/uploads",
    StaticFiles(directory=str(BACKEND_ROOT / "app" / "uploads")),
    name="uploads"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://powerchoice.pages.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


# Safe, repeatable migration: add missing columns without deleting data.
with engine.begin() as connection:
    if connection.dialect.name == "sqlite":
        # SQLite does not support ADD COLUMN IF NOT EXISTS.
        existing_columns = {
            column["name"]
            for column in connection.execute(
                text("PRAGMA table_info(products)")
            ).mappings()
        }

        if "link" not in existing_columns:
            connection.execute(
                text("ALTER TABLE products ADD COLUMN link VARCHAR")
            )

        if "is_portfolio" not in existing_columns:
            connection.execute(
                text(
                    "ALTER TABLE products "
                    "ADD COLUMN is_portfolio BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
    else:
        # Keep the existing PostgreSQL migration behavior.
        connection.execute(text("""
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS link VARCHAR
        """))

        connection.execute(text("""
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS is_portfolio BOOLEAN NOT NULL DEFAULT FALSE
        """))


# Register API routes
app.include_router(profile.router)
app.include_router(product.router)
app.include_router(review.router)
app.include_router(referral.router)
app.include_router(video_portfolio.router)
app.include_router(video_portfolio_admin.router)
app.include_router(video_portfolio_auth.router)
app.include_router(video_portfolio_upload.router)
app.include_router(video_production_content.router)



@app.get("/")
def home():
    return {
        "status": "success",
        "message": "PowerChoice Backend Running"
    }