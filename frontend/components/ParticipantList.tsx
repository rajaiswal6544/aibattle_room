import type { Participant } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function ParticipantList({ participants }: { participants: Participant[] }) {
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Participants</h2>
      {participants.length === 0 ? (
        <p className="text-sm text-slate-400">Share the room code to invite participants.</p>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => (
            <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-panelSoft p-3" key={participant.id}>
              <div>
                <p className="font-medium">{participant.display_name}</p>
                <p className="text-xs text-slate-500">{participant.role}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <StatusBadge value={participant.role} />
                <StatusBadge value={participant.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

