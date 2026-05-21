"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { createIdentity } from "@/lib/api";
import { useSessionStore } from "@/store/sessionStore";

export function IdentityGate({ children }: { children: React.ReactNode }) {
  const { identity, hydrated, hydrate, setIdentity } = useSessionStore();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => hydrate(), [hydrate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nextIdentity = await createIdentity(displayName, email || undefined);
      setIdentity(nextIdentity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create identity.");
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return <main className="min-h-screen bg-ink p-6 text-slate-100">Loading identity...</main>;
  }

  if (identity) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-6 text-slate-100">
      <form className="card w-full max-w-md space-y-4" onSubmit={onSubmit}>
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-line bg-panelSoft p-2">
            <UserRound className="h-5 w-5 text-signal" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Enter Battle Room</h1>
            <p className="text-sm text-slate-400">Create a persistent local identity.</p>
          </div>
        </div>
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Display name</span>
          <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Email or identity key</span>
          <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {error && <p className="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
        <button className="button-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Continue"}
        </button>
      </form>
    </main>
  );
}

