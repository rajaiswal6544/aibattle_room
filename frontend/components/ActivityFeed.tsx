import type { RoomEvent } from "@/lib/types";

function eventLabel(event: RoomEvent) {
  const payload = event.payload;
  switch (event.type) {
    case "room.created":
      return "Room created.";
    case "participant.joined":
      return `${payload.display_name || "A participant"} joined.`;
    case "round.started":
      return `Round ${payload.round_number || 1} started.`;
    case "submission.created":
      return `${payload.participant_name || "A participant"} submitted a prompt.`;
    case "job.status_changed":
      return `Generation job is ${payload.status}.`;
    case "submission.completed":
      return "Generation completed.";
    case "submission.failed":
      return "Generation failed.";
    case "submission.scored":
      return `Submission scored ${payload.score}/10 as ${payload.decision}.`;
    case "participant.eliminated":
      return "A participant was eliminated.";
    default:
      return event.type.replace(/\./g, " ");
  }
}

export function ActivityFeed({ events }: { events: RoomEvent[] }) {
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Activity</h2>
      {events.length === 0 ? (
        <p className="text-sm text-slate-400">Room activity will appear here.</p>
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {events.map((event) => (
            <div className="border-l border-line pl-3" key={event.id}>
              <p className="text-sm text-slate-200">{eventLabel(event)}</p>
              <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

