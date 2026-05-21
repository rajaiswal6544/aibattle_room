type Props = {
  value?: string | null;
};

const colorByValue: Record<string, string> = {
  connected: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  active: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  round_active: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  completed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  winner: "border-amber-300/50 bg-amber-300/10 text-amber-100",
  queued: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  running: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  generating: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  failed: "border-red-300/40 bg-red-300/10 text-red-100",
  timed_out: "border-red-300/40 bg-red-300/10 text-red-100",
  eliminated: "border-red-300/40 bg-red-300/10 text-red-100"
};

export function StatusBadge({ value }: Props) {
  const safe = value || "unknown";
  const label = safe.replace(/_/g, " ");
  return <span className={`badge ${colorByValue[safe] || ""}`}>{label}</span>;
}

