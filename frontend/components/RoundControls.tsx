"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { startRound } from "@/lib/api";
import type { Room, Round } from "@/lib/types";
import { useRoomStore } from "@/store/roomStore";
import { useSessionStore } from "@/store/sessionStore";

export function RoundControls({ room, round }: { room: Room; round?: Round | null }) {
  const identity = useSessionStore((state) => state.identity);
  const setSnapshot = useRoomStore((state) => state.setSnapshot);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const disabled = loading || Boolean(round);

  async function onStart() {
    if (!identity) return;
    setLoading(true);
    setError("");
    try {
      const snapshot = await startRound(room.id, identity.user_id);
      setSnapshot(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "You do not have permission to perform this action.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Host Controls</h2>
      <button className="button-primary" onClick={onStart} disabled={disabled}>
        <Play className="h-4 w-4" />
        {round ? "Round started" : loading ? "Starting..." : "Start round"}
      </button>
      {error && <p className="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
    </section>
  );
}

