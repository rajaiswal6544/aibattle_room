from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models


def get_user_or_404(db: Session, user_id: str) -> models.User:
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


def get_room_by_code_or_404(db: Session, room_code: str) -> models.Room:
    room = db.query(models.Room).filter(models.Room.code == room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    return room


def get_participant(db: Session, room_id: str, user_id: str) -> models.Participant | None:
    return (
        db.query(models.Participant)
        .filter(models.Participant.room_id == room_id, models.Participant.user_id == user_id)
        .first()
    )


def require_host(db: Session, room: models.Room, user_id: str) -> models.Participant:
    participant = get_participant(db, room.id, user_id)
    if not participant or participant.role != "host":
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
    return participant


def require_active_contestant(db: Session, room: models.Room, user_id: str) -> models.Participant:
    participant = get_participant(db, room.id, user_id)
    if not participant or participant.role != "participant":
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
    if participant.status == "eliminated":
        raise HTTPException(status_code=403, detail="Eliminated participants cannot submit.")
    return participant

