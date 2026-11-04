import os
import uuid
from pathlib import PurePosixPath
from urllib.parse import quote

import boto3
from botocore.config import Config


BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "creator-yard-media")


def save_image(file, folder):
    try:
        account_id = os.getenv("R2_ACCOUNT_ID")
        access_key = os.getenv("R2_ACCESS_KEY_ID")
        secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        public_base_url = os.getenv("R2_PUBLIC_BASE_URL", "").rstrip("/")

        missing = [
            name
            for name, value in (
                ("R2_ACCOUNT_ID", account_id),
                ("R2_ACCESS_KEY_ID", access_key),
                ("R2_SECRET_ACCESS_KEY", secret_key),
                ("R2_PUBLIC_BASE_URL", public_base_url),
            )
            if not value
        ]

        if missing:
            raise ValueError(
                "Missing R2 configuration: " + ", ".join(missing)
            )

        endpoint_url = (
            f"https://{account_id}.r2.cloudflarestorage.com"
        )

        s3 = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )

        original_name = PurePosixPath(
            (file.filename or "upload").replace("\\", "/")
        ).name
        safe_name = original_name.replace(" ", "_")
        filename = f"{uuid.uuid4()}_{safe_name}"
        path = f"{folder.strip('/')}/{filename}"

        file_bytes = file.file.read()
        if not file_bytes:
            raise ValueError("The uploaded file is empty.")

        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=path,
            Body=file_bytes,
            ContentType=file.content_type or "application/octet-stream",
        )

        url = f"{public_base_url}/{quote(path, safe='/')}"

        return {
            "filename": filename,
            "path": path,
            "url": url,
        }

    except Exception as e:
        raise Exception(f"Image upload failed: {str(e)}") from e
