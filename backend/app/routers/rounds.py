from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.permissions import require_host
from app.services.room_events import record_and_broadcast
from app.services.snapshots import room_snapshot

router = APIRouter(prefix="/api", tags=["rounds"])


@router.post("/rooms/{room_id}/rounds/start")
async def start_round(room_id: str, payload: schemas.StartRoundRequest, db: Session = Depends(get_db)):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    require_host(db, room, payload.host_user_id)

    active_round = (
        db.query(models.Round)
        .filter(models.Round.room_id == room.id, models.Round.status == "active")
        .first()
    )
    if active_round:
        raise HTTPException(status_code=409, detail="A round is already active.")
    existing_round_count = db.query(models.Round).filter(models.Round.room_id == room.id).count()
    if existing_round_count >= 1:
        raise HTTPException(status_code=409, detail="This assignment build supports one battle round.")

    round_ = models.Round(room_id=room.id, round_number=1, status="active")
    room.status = "round_active"
    db.add(round_)
    db.commit()
    db.refresh(round_)
    await record_and_broadcast(
        db,
        room,
        "round.started",
        {"round_id": round_.id, "round_number": round_.round_number, "status": round_.status},
    )
    return room_snapshot(db, room)

