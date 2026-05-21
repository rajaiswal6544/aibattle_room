"use client";

import { create } from "zustand";
import { getRoom, WS_BASE } from "@/lib/api";
import type { ConnectionStatus, RoomSnapshot } from "@/lib/types";

type RoomState = {
  snapshot: RoomSnapshot | null;
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  socket: WebSocket | null;
  setSnapshot: (snapshot: RoomSnapshot) => void;
  fetchRoom: (code: string) => Promise<void>;
  connect: (code: string, userId: string) => void;
  disconnect: () => void;
  setError: (error: string | null) => void;
};

export const useRoomStore = create<RoomState>((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,
  connectionStatus: "offline",
  socket: null,
  setSnapshot: (snapshot) => set({ snapshot }),
  setError: (error) => set({ error }),
  fetchRoom: async (code) => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getRoom(code);
      set({ snapshot, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not load room.", loading: false });
    }
  },
  connect: (code, userId) => {
    get().disconnect();
    set({ connectionStatus: "connecting" });
    const socket = new WebSocket(`${WS_BASE}/ws/rooms/${code}?user_id=${encodeURIComponent(userId)}`);
    socket.onopen = () => set({ connectionStatus: "connected" });
    socket.onmessage = async (message) => {
      const event = JSON.parse(message.data);
      if (event.type === "room.snapshot") {
        set({ snapshot: event.payload });
      } else {
        await get().fetchRoom(code);
      }
    };
    socket.onclose = () => {
      set({ connectionStatus: "reconnecting", socket: null });
      window.setTimeout(() => {
        if (get().connectionStatus === "reconnecting") {
          get().connect(code, userId);
        }
      }, 1500);
    };
    socket.onerror = () => set({ connectionStatus: "offline" });
    set({ socket });
  },
  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
    set({ socket: null, connectionStatus: "offline" });
  }
}));

