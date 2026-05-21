"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createRoom } from "@/lib/api";
import { useSessionStore } from "@/store/sessionStore";

export function CreateRoomForm() {
  const router = useRouter();
  const identity = useSessionStore((state) => state.identity);
  const [title, setTitle] = useState("Cyberpunk Perfume Battle");
  const [challenge, setChallenge] = useState("Create the most insane luxury cyberpunk perfume campaign for Gen-Z.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!identity) return;
    setLoading(true);
    setError("");
    try {
      const snapshot = await createRoom(identity.user_id, title, challenge);
      router.push(`/room/${snapshot.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card space-y-4" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold">Create Room</h2>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Room title</span>
        <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Challenge prompt</span>
        <textarea className="input min-h-32" value={challenge} onChange={(event) => setChallenge(event.target.value)} />
      </label>
      {error && <p className="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      <button className="button-primary" disabled={loading}>
        <Plus className="h-4 w-4" />
        {loading ? "Creating..." : "Create room"}
      </button>
    </form>
  );
}

