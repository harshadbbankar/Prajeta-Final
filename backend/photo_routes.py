"""Driver profile photos: driver uploads a uniform photo, staff approve it, customers see approved photos."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel

from core import db, now_iso, new_id, require_driver, require_roles, get_current_user, notify, notify_admins, put_object, get_object, APP_NAME, audit

router = APIRouter(prefix="/api")
VERIFY = require_roles("owner", "super_admin", "ops", "verification")
IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 8 * 1024 * 1024


def sniff_image(data: bytes) -> Optional[str]:
    """Real image type from the file header (don't trust the client's content type)."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def photo_view(photo: Optional[dict]) -> Optional[dict]:
    """Photo metadata without the storage path."""
    if not photo:
        return None
    return {k: v for k, v in photo.items() if k != "path"}


def approved_photo_url(p: dict) -> Optional[str]:
    ph = p.get("photo") or {}
    if ph.get("status") == "APPROVED":
        return f"/api/public/driver-photo/{ph['id']}"
    prev = p.get("approved_photo")
    return f"/api/public/driver-photo/{prev['id']}" if prev else None


@router.post("/driver/photo")
async def upload_photo(file: UploadFile = File(...), user: dict = Depends(require_driver)):
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "Photo too large (max 8 MB)")
    ctype = sniff_image(data)
    if not ctype:
        raise HTTPException(400, "Upload a JPG, PNG or WEBP photo")
    p = await db.driver_profiles.find_one({"user_id": user["id"]}, {"_id": 0, "photo": 1, "approved_photo": 1, "name": 1})
    if p is None:
        raise HTTPException(404, "Driver profile not found")
    pid = new_id()
    ext = {"image/png": "png", "image/webp": "webp"}.get(ctype, "jpg")
    result = await run_in_threadpool(put_object, f"{APP_NAME}/driver-photos/{user['id']}/{pid}.{ext}", data, ctype)
    photo = {"id": pid, "path": result["path"], "content_type": ctype, "status": "PENDING", "reason": None, "uploaded_at": now_iso()}
    upd = {"photo": photo}
    # Keep the previously approved photo visible to customers until the new one is reviewed
    cur = p.get("photo") or {}
    if cur.get("status") == "APPROVED":
        upd["approved_photo"] = cur
    await db.driver_profiles.update_one({"user_id": user["id"]}, {"$set": upd})
    await notify_admins("Driver photo to review", f"{p.get('name') or 'A driver'} uploaded a new profile photo.")
    return photo_view(photo)


@router.get("/driver/photo/file/{photo_id}")
async def photo_file(photo_id: str, user: dict = Depends(get_current_user)):
    """Any photo (incl. pending) for the driver themself or verification staff."""
    q = {"$or": [{"photo.id": photo_id}, {"approved_photo.id": photo_id}]}
    if user["role"] not in ("owner", "super_admin", "verification", "ops"):
        q["user_id"] = user["id"]
    return await _serve(q, photo_id)


@router.get("/public/driver-photo/{photo_id}")
async def public_photo(photo_id: str):
    """Approved photos only — shown to customers on their booking."""
    q = {"$or": [{"photo.id": photo_id, "photo.status": "APPROVED"}, {"approved_photo.id": photo_id}]}
    p = await db.driver_profiles.find_one(q, {"_id": 0, "photo": 1, "approved_photo": 1})
    ph = next((x for x in ((p or {}).get("photo"), (p or {}).get("approved_photo")) if x and x["id"] == photo_id and (x is (p or {}).get("approved_photo") or x.get("status") == "APPROVED")), None)
    if not ph:
        raise HTTPException(404, "Photo not found")
    data, ctype = await run_in_threadpool(get_object, ph["path"])
    return Response(content=data, media_type=ph.get("content_type") or ctype, headers={"Cache-Control": "public, max-age=3600"})


async def _serve(q: dict, photo_id: str):
    p = await db.driver_profiles.find_one(q, {"_id": 0, "photo": 1, "approved_photo": 1})
    ph = next((x for x in ((p or {}).get("photo"), (p or {}).get("approved_photo")) if x and x["id"] == photo_id), None)
    if not ph:
        raise HTTPException(404, "Photo not found")
    data, ctype = await run_in_threadpool(get_object, ph["path"])
    return Response(content=data, media_type=ph.get("content_type") or ctype, headers={"Cache-Control": "private, max-age=3600"})


class PhotoReviewIn(BaseModel):
    approve: bool
    reason: str = ""


@router.post("/admin/drivers/{user_id}/photo")
async def review_photo(user_id: str, body: PhotoReviewIn, user: dict = Depends(VERIFY)):
    p = await db.driver_profiles.find_one({"user_id": user_id}, {"_id": 0, "photo": 1})
    if not p or not p.get("photo"):
        raise HTTPException(404, "No photo uploaded")
    if not body.approve and not body.reason.strip():
        raise HTTPException(400, "Tell the driver why the photo was rejected")
    status = "APPROVED" if body.approve else "REJECTED"
    upd = {"photo.status": status, "photo.reason": None if body.approve else body.reason.strip(), "photo.reviewed_at": now_iso(),
           "photo.reviewed_by": user["id"]}
    unset = {"approved_photo": ""} if body.approve else {}
    await db.driver_profiles.update_one({"user_id": user_id}, {"$set": upd, **({"$unset": unset} if unset else {})})
    await audit(user, "driver_photo_" + status.lower(), "driver", user_id, {"reason": body.reason})
    if body.approve:
        await notify(user_id, "Profile photo approved", "Customers will now see your photo on their bookings.")
    else:
        await notify(user_id, "Profile photo not approved", f"{body.reason.strip()}. Please upload a new photo in uniform.")
    return {"ok": True, "status": status}
