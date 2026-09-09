"use client";

// Client state. Persists to localStorage so a rehearsal can be resumed.
// Reset demo clears it.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LogActor, Portco } from "./types";
import { freshPortcos, loadDemoState } from "./data";
import { nowIso } from "./pipeline";

export const STORE_VERSION = 2;

const DEFAULT_MOCK = process.env.MOCK_MODE !== "false";

export type AppState = {
  portcos: Record<string, Portco>;
  mockMode: boolean;
  selectedPortcoId: string | null;
  presenterOpen: boolean;
  working: { portcoId: string; label: string } | null;

  selectPortco: (id: string | null) => void;
  updatePortco: (id: string, fn: (p: Portco) => Portco) => void;
  addLog: (id: string, actor: LogActor, text: string) => void;
  setMockMode: (v: boolean) => void;
  setPresenterOpen: (v: boolean) => void;
  setWorking: (w: { portcoId: string; label: string } | null) => void;
  loadState: (name: string) => void;
  reset: () => void;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      portcos: freshPortcos(),
      mockMode: DEFAULT_MOCK,
      selectedPortcoId: null,
      presenterOpen: false,
      working: null,

      selectPortco: (id) => set({ selectedPortcoId: id }),
      updatePortco: (id, fn) =>
        set((s) => (s.portcos[id] ? { portcos: { ...s.portcos, [id]: fn(s.portcos[id]) } } : {})),
      addLog: (id, actor, text) =>
        set((s) => {
          const p = s.portcos[id];
          if (!p) return {};
          return { portcos: { ...s.portcos, [id]: { ...p, log: [...p.log, { at: nowIso(), actor, text }] } } };
        }),
      setMockMode: (v) => set({ mockMode: v }),
      setPresenterOpen: (v) => set({ presenterOpen: v }),
      setWorking: (working) => set({ working }),
      loadState: (name) => set({ portcos: loadDemoState(name), selectedPortcoId: null, working: null }),
      reset: () => set({ portcos: freshPortcos(), selectedPortcoId: null, working: null }),
    }),
    {
      name: "greenbriar-scheduler",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ portcos: s.portcos, mockMode: s.mockMode }),
      migrate: () => ({ portcos: freshPortcos(), mockMode: DEFAULT_MOCK }) as Partial<AppState>,
    },
  ),
);
