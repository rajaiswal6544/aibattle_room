import json
from typing import Any

from sqlalchemy.orm import Session

from app import models
from app.services.websocket_manager import manager


async def record_and_broadcast(
    db: Session,
    room: models.Room,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    event = models.RoomEvent(room_id=room.id, type=event_type, payload_json=json.dumps(payload))
    db.add(event)
    db.commit()
    await manager.broadcast(room.code, event_type, payload)

