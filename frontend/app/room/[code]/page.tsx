"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ChallengeCard } from "@/components/ChallengeCard";
import { IdentityGate } from "@/components/IdentityGate";
import { Leaderboard } from "@/components/Leaderboard";
import { ParticipantList } from "@/components/ParticipantList";
import { RoomHeader } from "@/components/RoomHeader";
import { RoundControls } from "@/components/RoundControls";
import { SubmissionCard } from "@/components/SubmissionCard";
import { SubmissionPanel } from "@/components/SubmissionPanel";
import { useRoomStore } from "@/store/roomStore";
import { useSessionStore } from "@/store/sessionStore";

function RoomContent() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = String(params.code || "").toUpperCase();
  const identity = useSessionStore((state) => state.identity);
  const { snapshot, loading, error, connectionStatus, fetchRoom, connect, disconnect } = useRoomStore();

  useEffect(() => {
    if (!identity || !code) return;
    fetchRoom(code);
    connect(code, identity.user_id);
    return () => disconnect();
  }, [code, identity, fetchRoom, connect, disconnect]);

  const currentParticipant = useMemo(
    () => snapshot?.participants.find((participant) => participant.user_id === identity?.user_id),
    [snapshot?.participants, identity?.user_id]
  );
  const isHost = currentParticipant?.role === "host";

  if (loading && !snapshot) {
    return <main className="min-h-screen bg-ink p-6 text-slate-100">Loading room...</main>;
  }

  if (error && !snapshot) {
    return (
      <main className="min-h-screen bg-ink p-6 text-slate-100">
        <div className="card mx-auto max-w-xl space-y-4">
          <p className="text-red-100">{error}</p>
          <button className="button-secondary" onClick={() => router.push("/")}>Back home</button>
        </div>
      </main>
    );
  }

  if (!snapshot) {
    return <main className="min-h-screen bg-ink p-6 text-slate-100">Connecting...</main>;
  }

  return (
    <main className="min-h-screen bg-ink text-slate-100">
      <RoomHeader room={snapshot.room} currentParticipant={currentParticipant} connectionStatus={connectionStatus} />
      {connectionStatus !== "connected" && (
        <div className="border-b border-amber-300/30 bg-amber-300/10 px-5 py-2 text-sm text-amber-100">
          Live connection lost. Reconnecting...
        </div>
      )}
      <div className="mx-auto grid max-w-7xl gap-5 p-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <ChallengeCard room={snapshot.room} round={snapshot.current_round} />
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Submissions</h2>
              <span className="text-sm text-slate-500">{snapshot.submissions.length} total</span>
            </div>
            {snapshot.submissions.length === 0 ? (
              <div className="card text-sm text-slate-400">No submissions yet. Participants will appear here once they submit.</div>
            ) : (
              snapshot.submissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} canJudge={isHost} />
              ))
            )}
          </section>
          {isHost ? (
            <RoundControls room={snapshot.room} round={snapshot.current_round} />
          ) : (
            <SubmissionPanel snapshot={snapshot} currentParticipant={currentParticipant} />
          )}
        </div>
        <aside className="space-y-5">
          <ParticipantList participants={snapshot.participants} />
          <Leaderboard submissions={snapshot.submissions} />
          <ActivityFeed events={snapshot.events} />
        </aside>
      </div>
    </main>
  );
}

export default function RoomPage() {
  return (
    <IdentityGate>
      <RoomContent />
    </IdentityGate>
  );
}

