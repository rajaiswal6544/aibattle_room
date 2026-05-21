import type { Room, Round } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function ChallengeCard({ room, round }: { room: Room; round?: Round | null }) {
  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Challenge</h2>
        <div className="flex gap-2">
          <StatusBadge value={room.status} />
          {round && <StatusBadge value={round.status} />}
        </div>
      </div>
      <p className="text-base leading-7 text-slate-100">{room.challenge_prompt}</p>
      <p className="text-sm text-slate-400">
        {round ? `Round ${round.round_number} is ${round.status}.` : "Waiting for the host to start the first round."}
      </p>
    </section>
  );
}

