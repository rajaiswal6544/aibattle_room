"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { joinRoom } from "@/lib/api";
import { useSessionStore } from "@/store/sessionStore";

export function JoinRoomForm() {
  const router = useRouter();
  const identity = useSessionStore((state) => state.identity);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!identity) return;
    setLoading(true);
    setError("");
    try {
      const snapshot = await joinRoom(code, identity.user_id);
      router.push(`/room/${snapshot.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Room not found. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card space-y-4" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold">Join Room</h2>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Room code</span>
        <input
          className="input uppercase"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="ABC123"
        />
      </label>
      {error && <p className="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      <button className="button-secondary" disabled={loading || code.trim().length < 4}>
        <LogIn className="h-4 w-4" />
        {loading ? "Joining..." : "Join room"}
      </button>
    </form>
  );
}

