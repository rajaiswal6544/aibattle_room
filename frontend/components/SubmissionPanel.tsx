"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { submitPrompt } from "@/lib/api";
import type { Participant, RoomSnapshot } from "@/lib/types";
import { useRoomStore } from "@/store/roomStore";
import { useSessionStore } from "@/store/sessionStore";
import { StatusBadge } from "./StatusBadge";

type Props = {
  snapshot: RoomSnapshot;
  currentParticipant?: Participant;
};

export function SubmissionPanel({ snapshot, currentParticipant }: Props) {
  const identity = useSessionStore((state) => state.identity);
  const fetchRoom = useRoomStore((state) => state.fetchRoom);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ownSubmission = useMemo(
    () => snapshot.submissions.find((submission) => submission.participant_id === currentParticipant?.id),
    [snapshot.submissions, currentParticipant?.id]
  );

  if (!currentParticipant || currentParticipant.role === "host") {
    return (
      <section className="card">
        <p className="text-sm text-slate-400">Hosts judge the battle here; contestant submissions appear in the main feed.</p>
      </section>
    );
  }

  if (!snapshot.current_round || snapshot.current_round.status !== "active") {
    return (
      <section className="card">
        <p className="text-sm text-slate-400">Waiting for host to start the round.</p>
      </section>
    );
  }

  if (ownSubmission) {
    return (
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Submission</h2>
          <StatusBadge value={ownSubmission.job?.status || ownSubmission.status} />
        </div>
        <p className="text-sm text-slate-300">{ownSubmission.prompt}</p>
        <p className="text-sm text-slate-500">
          {ownSubmission.status === "completed" ? "Generated output is ready." : "Your job is moving through the queue."}
        </p>
      </section>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!identity || !snapshot.current_round) return;
    if (prompt.trim().length < 10) {
      setError("Prompt must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await submitPrompt(snapshot.current_round.id, identity.user_id, prompt);
      setPrompt("");
      await fetchRoom(snapshot.room.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit prompt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card space-y-3" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold">Submit Prompt</h2>
      <textarea
        className="input min-h-28"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Make it feel like Blade Runner meets Dior..."
      />
      {error && <p className="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
      <button className="button-primary" disabled={loading}>
        <Send className="h-4 w-4" />
        {loading ? "Submitting..." : "Submit prompt"}
      </button>
    </form>
  );
}

