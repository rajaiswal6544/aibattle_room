from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/identity", tags=["identity"])


@router.post("")
def create_identity(payload: schemas.IdentityRequest, db: Session = Depends(get_db)):
    display_name = payload.display_name.strip()
    identity_key = (payload.email or display_name).strip().lower()
    user = db.query(models.User).filter(models.User.identity_key == identity_key).first()
    if user:
        user.display_name = display_name
    else:
        user = models.User(display_name=display_name, identity_key=identity_key)
        db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": user.id, "display_name": user.display_name, "identity_key": user.identity_key}

