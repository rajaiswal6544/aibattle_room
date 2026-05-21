from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db, init_db
from app.routers import identity, jobs, rooms, rounds, scores, submissions
from app.services.permissions import get_participant, get_room_by_code_or_404
from app.services.snapshots import room_snapshot
from app.services.websocket_manager import manager

app = FastAPI(title="AI Creative Battle Room")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(identity.router)
app.include_router(rooms.router)
app.include_router(rounds.router)
app.include_router(submissions.router)
app.include_router(scores.router)
app.include_router(jobs.router)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health():
    return {"ok": True}


@app.websocket("/ws/rooms/{room_code}")
async def room_socket(
    websocket: WebSocket,
    room_code: str,
    user_id: str,
    db: Session = Depends(get_db),
):
    room = get_room_by_code_or_404(db, room_code)
    participant = get_participant(db, room.id, user_id)
    if not participant:
        await websocket.close(code=1008)
        return

    code = room.code
    await manager.connect(code, websocket)
    await websocket.send_json({"type": "room.snapshot", "payload": room_snapshot(db, room)})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(code, websocket)
