"use client";

import { Copy, LogOut } from "lucide-react";
import type { ConnectionStatus as Status, Participant, Room } from "@/lib/types";
import { useSessionStore } from "@/store/sessionStore";
import { ConnectionStatus } from "./ConnectionStatus";
import { StatusBadge } from "./StatusBadge";

type Props = {
  room: Room;
  currentParticipant?: Participant;
  connectionStatus: Status;
};

export function RoomHeader({ room, currentParticipant, connectionStatus }: Props) {
  const clearIdentity = useSessionStore((state) => state.clearIdentity);

  async function copyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${room.code}`);
  }

  return (
    <header className="border-b border-line bg-panel/80 px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{room.title}</h1>
            <StatusBadge value={room.status} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Code <span className="font-mono text-slate-100">{room.code}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {currentParticipant && <StatusBadge value={currentParticipant.role} />}
          <ConnectionStatus status={connectionStatus} />
          <button className="button-secondary" onClick={copyInvite} title="Copy invite link">
            <Copy className="h-4 w-4" />
            Copy link
          </button>
          <button className="button-secondary" onClick={clearIdentity} title="Clear local identity">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

