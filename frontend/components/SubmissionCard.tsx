"use client";

import { useState } from "react";
import { Award, RotateCcw } from "lucide-react";
import { retryGenerationJob, scoreSubmission } from "@/lib/api";
import type { Decision, Submission } from "@/lib/types";
import { useRoomStore } from "@/store/roomStore";
import { useSessionStore } from "@/store/sessionStore";
import { StatusBadge } from "./StatusBadge";

type Props = {
  submission: Submission;
  canJudge: boolean;
};

export function SubmissionCard({ submission, canJudge }: Props) {
  const identity = useSessionStore((state) => state.identity);
  const setSnapshot = useRoomStore((state) => state.setSnapshot);
  const [score, setScore] = useState(submission.score?.score || 8);
  const [decision, setDecision] = useState<Decision>(submission.score?.decision || "survived");
  const [comment, setComment] = useState(submission.score?.comment || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const judgeable = canJudge && ["completed", "failed"].includes(submission.status);
  const retryable = Boolean(submission.job && ["failed", "timed_out"].includes(submission.job.status));

  async function onScore(event: React.FormEvent) {
    event.preventDefault();
    if (!identity) return;
    setLoading(true);
    setError("");
    try {
      const snapshot = await scoreSubmission(submission.id, identity.user_id, score, decision, comment || undefined);
      setSnapshot(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "You do not have permission to perform this action.");
    } finally {
      setLoading(false);
    }
  }

  async function onRetry() {
    if (!identity || !submission.job) return;
    setRetrying(true);
    setError("");
    try {
      const snapshot = await retryGenerationJob(submission.job.id, identity.user_id);
      setSnapshot(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retry generation.")
    } finally {
      setRetrying(false);
    }
  }

  return (
    <article className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{submission.participant_name}</h3>
          <p className="text-xs text-slate-500">{new Date(submission.created_at).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={submission.job?.status || submission.status} />
          {submission.score && <StatusBadge value={submission.score.decision} />}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">Prompt</p>
        <p className="mt-1 text-sm leading-6 text-slate-200">{submission.prompt}</p>
      </div>
      <div className="rounded-md border border-line bg-panelSoft p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Generated Output</p>
        {submission.generated_output ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-100">{submission.generated_output}</p>
        ) : submission.status === "failed" ? (
          <p className="mt-2 text-sm text-red-100">{submission.error_message || "AI generation failed. The room is still active."}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">AI output will appear here when generation completes.</p>
        )}
      </div>
      {submission.score && (
        <div className="rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-50">
          Score {submission.score.score}/10, {submission.score.decision}
          {submission.score.comment ? `: ${submission.score.comment}` : ""}
        </div>
      )}
      {retryable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-300/30 bg-red-400/10 p-3">
          <p className="text-sm text-red-100">Generation failed. The room is still active.</p>
          <button className="button-secondary" onClick={onRetry} disabled={retrying}>
            <RotateCcw className="h-4 w-4" />
            {retrying ? "Retrying..." : "Retry generation"}
          </button>
        </div>
      )}
      {judgeable && (
        <form className="grid gap-3 md:grid-cols-[120px_160px_1fr_auto]" onSubmit={onScore}>
          <input
            className="input"
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
          />
          <select className="input" value={decision} onChange={(event) => setDecision(event.target.value as Decision)}>
            <option value="survived">Survived</option>
            <option value="eliminated">Eliminated</option>
            <option value="winner">Winner</option>
          </select>
          <input className="input" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional comment" />
          <button className="button-primary" disabled={loading}>
            <Award className="h-4 w-4" />
            {loading ? "Saving..." : "Score"}
          </button>
          {error && <p className="md:col-span-4 rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
        </form>
      )}
    </article>
  );
}
