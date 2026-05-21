"use client";

import { CreateRoomForm } from "@/components/CreateRoomForm";
import { IdentityGate } from "@/components/IdentityGate";
import { JoinRoomForm } from "@/components/JoinRoomForm";
import { useSessionStore } from "@/store/sessionStore";

function HomeContent() {
  const identity = useSessionStore((state) => state.identity);

  return (
    <main className="min-h-screen bg-ink p-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">AI Creative Battle Room</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Host a prompt battle, watch async generation jobs update live, and judge the final creative output.
            </p>
          </div>
          <div className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-300">
            Signed in as <span className="font-semibold text-slate-100">{identity?.display_name}</span>
          </div>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          <CreateRoomForm />
          <JoinRoomForm />
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <IdentityGate>
      <HomeContent />
    </IdentityGate>
  );
}

