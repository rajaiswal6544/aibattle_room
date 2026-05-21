import type { Submission } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function decisionWeight(submission: Submission) {
  if (submission.score?.decision === "winner") return 3;
  if (submission.score?.decision === "survived") return 2;
  if (submission.score?.decision === "eliminated") return 1;
  return 0;
}

export function Leaderboard({ submissions }: { submissions: Submission[] }) {
  const ranked = [...submissions].sort((a, b) => {
    const decision = decisionWeight(b) - decisionWeight(a);
    if (decision) return decision;
    const score = (b.score?.score || 0) - (a.score?.score || 0);
    if (score) return score;
    const completed = Number(b.status === "completed") - Number(a.status === "completed");
    if (completed) return completed;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Leaderboard</h2>
      {ranked.length === 0 ? (
        <p className="text-sm text-slate-400">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {ranked.map((submission, index) => (
            <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-panelSoft p-3" key={submission.id}>
              <div>
                <p className="text-sm font-medium">
                  #{index + 1} {submission.participant_name}
                </p>
                <p className="text-xs text-slate-500">{submission.score ? `${submission.score.score}/10` : "Unscored"}</p>
              </div>
              <StatusBadge value={submission.score?.decision || submission.status} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

