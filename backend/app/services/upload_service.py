import uuid

from app.services.supabase import supabase


BUCKET_NAME = "powerchoice-images"


def save_image(file, folder):
    try:
        # Read uploaded file
        file_bytes = file.file.read()

        # Create unique filename
        filename = f"{uuid.uuid4()}_{file.filename}"

        # Path inside Supabase Storage
        path = f"{folder}/{filename}"

        # Upload to Supabase
        supabase.storage.from_(BUCKET_NAME).upload(
            path,
            file_bytes,
            {
                "content-type": file.content_type,
                "upsert": "true",
            }
        )

        # Get public URL
        url = supabase.storage.from_(BUCKET_NAME).get_public_url(path)

        return {
            "filename": filename,
            "path": path,
            "url": url,
        }

    except Exception as e:
        raise Exception(f"Image upload failed: {str(e)}")