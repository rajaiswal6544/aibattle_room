from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, room_code: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._rooms[room_code].add(websocket)

    def disconnect(self, room_code: str, websocket: WebSocket) -> None:
        sockets = self._rooms.get(room_code)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._rooms.pop(room_code, None)

    async def broadcast(self, room_code: str, event_type: str, payload: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        message = {"type": event_type, "payload": payload}
        for websocket in list(self._rooms.get(room_code, set())):
            try:
                await websocket.send_json(message)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(room_code, websocket)


manager = WebSocketManager()

