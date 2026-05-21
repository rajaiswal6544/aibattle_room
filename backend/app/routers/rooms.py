import random
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.permissions import get_room_by_code_or_404, get_user_or_404
from app.services.room_events import record_and_broadcast
from app.services.snapshots import room_snapshot

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def make_room_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(random.choice(alphabet) for _ in range(6))
        if not db.query(models.Room).filter(models.Room.code == code).first():
            return code
    raise HTTPException(status_code=500, detail="Could not allocate room code.")


@router.post("")
async def create_room(payload: schemas.CreateRoomRequest, db: Session = Depends(get_db)):
    user = get_user_or_404(db, payload.host_user_id)
    room = models.Room(
        code=make_room_code(db),
        title=payload.title.strip(),
        challenge_prompt=payload.challenge_prompt.strip(),
        host_user_id=user.id,
    )
    db.add(room)
    db.flush()
    participant = models.Participant(room_id=room.id, user_id=user.id, role="host")
    db.add(participant)
    db.commit()
    db.refresh(room)
    await record_and_broadcast(
        db,
        room,
        "room.created",
        {"room_id": room.id, "code": room.code, "title": room.title, "host_user_id": user.id},
    )
    return room_snapshot(db, room)


@router.post("/{room_code}/join")
async def join_room(room_code: str, payload: schemas.JoinRoomRequest, db: Session = Depends(get_db)):
    user = get_user_or_404(db, payload.user_id)
    room = get_room_by_code_or_404(db, room_code)
    existing = (
        db.query(models.Participant)
        .filter(models.Participant.room_id == room.id, models.Participant.user_id == user.id)
        .first()
    )
    if existing:
        return room_snapshot(db, room)

    participant = models.Participant(room_id=room.id, user_id=user.id, role="participant")
    db.add(participant)
    db.commit()
    db.refresh(participant)
    await record_and_broadcast(
        db,
        room,
        "participant.joined",
        {"participant_id": participant.id, "user_id": user.id, "display_name": user.display_name},
    )
    return room_snapshot(db, room)


@router.get("/{room_code}")
def get_room(room_code: str, db: Session = Depends(get_db)):
    room = get_room_by_code_or_404(db, room_code)
    return room_snapshot(db, room)

