import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024

class StorageService:
    def __init__(self):
        self.upload_dir = os.path.abspath(settings.UPLOAD_DIR)
        os.makedirs(self.upload_dir, exist_ok=True)

    async def upload_image(self, file: UploadFile) -> str:
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format {ext}. Allowed: JPG, JPEG, PNG, WebP"
            )
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported content type {file.content_type}"
            )
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 5MB limit"
            )
        unique_filename = f"{uuid.uuid4()}{ext}"
        target_path = os.path.join(self.upload_dir, unique_filename)
        async with aiofiles.open(target_path, "wb") as f:
            await f.write(contents)
        return f"/uploads/{unique_filename}"

    def delete_image(self, image_url: str) -> bool:
        if not image_url.startswith("/uploads/"):
            return False
        filename = os.path.basename(image_url)
        target_path = os.path.join(self.upload_dir, filename)
        if os.path.exists(target_path):
            os.remove(target_path)
            return True
        return False

storage_service = StorageService()
