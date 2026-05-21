"use client";

import { create } from "zustand";
import type { Identity } from "@/lib/types";

const STORAGE_KEY = "battle-room.identity";

type SessionState = {
  identity: Identity | null;
  hydrated: boolean;
  hydrate: () => void;
  setIdentity: (identity: Identity) => void;
  clearIdentity: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  identity: null,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    set({ identity: raw ? JSON.parse(raw) : null, hydrated: true });
  },
  setIdentity: (identity) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    }
    set({ identity });
  },
  clearIdentity: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({ identity: null });
  }
}));

