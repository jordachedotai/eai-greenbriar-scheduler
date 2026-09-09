"use client";

// Client state. Persists to localStorage so a rehearsal can be resumed.
// Reset loads the room default state, `council`.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LogActor, Portco } from "./types";
import type { Bucket } from "./pipeline";
import { loadDemoState } from "./data";
import { nowIso } from "./pipeline";

export const STORE_VERSION = 4;
export const DEFAULT_STATE = "council";

const DEFAULT_MOCK = process.env.MOCK_MODE !== "false";

export type View = "rows" | "board";
export type EaFilter = "mine" | "all";

export type AppState = {
  portcos: Record<string, Portco>;
  mockMode: boolean;
  loggedIn: boolean;
  view: View;
  eaFilter: EaFilter;
  workFilter: Bucket | null;
  showDemoTag: boolean;
  sidebarCollapsed: boolean;
  presenterOpen: boolean;
  working: { portcoId: string; label: string } | null;

  updatePortco: (id: string, fn: (p: Portco) => Portco) => void;
  addLog: (id: string, actor: LogActor, text: string) => void;
  setMockMode: (v: boolean) => void;
  setLoggedIn: (v: boolean) => void;
  setView: (v: View) => void;
  setEaFilter: (v: EaFilter) => void;
  setWorkFilter: (v: Bucket | null) => void;
  setShowDemoTag: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setPresenterOpen: (v: boolean) => void;
  setWorking: (w: { portcoId: string; label: string } | null) => void;
  loadState: (name: string) => void;
  reset: () => void;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      portcos: loadDemoState(DEFAULT_STATE),
      mockMode: DEFAULT_MOCK,
      loggedIn: false,
      view: "rows",
      eaFilter: "mine",
      workFilter: null,
      showDemoTag: true,
      sidebarCollapsed: false,
      presenterOpen: false,
      working: null,

      updatePortco: (id, fn) =>
        set((s) => (s.portcos[id] ? { portcos: { ...s.portcos, [id]: fn(s.portcos[id]) } } : {})),
      addLog: (id, actor, text) =>
        set((s) => {
          const p = s.portcos[id];
          if (!p) return {};
          return { portcos: { ...s.portcos, [id]: { ...p, log: [...p.log, { at: nowIso(), actor, text }] } } };
        }),
      setMockMode: (v) => set({ mockMode: v }),
      setLoggedIn: (v) => set({ loggedIn: v }),
      setView: (v) => set({ view: v }),
      setEaFilter: (v) => set({ eaFilter: v, workFilter: null }),
      setWorkFilter: (v) => set({ workFilter: v }),
      setShowDemoTag: (v) => set({ showDemoTag: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setPresenterOpen: (v) => set({ presenterOpen: v }),
      setWorking: (working) => set({ working }),
      loadState: (name) => set({ portcos: loadDemoState(name), working: null, workFilter: null }),
      reset: () => set({ portcos: loadDemoState(DEFAULT_STATE), working: null, workFilter: null, view: "rows", eaFilter: "mine" }),
    }),
    {
      name: "greenbriar-scheduler",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        portcos: s.portcos,
        mockMode: s.mockMode,
        loggedIn: s.loggedIn,
        view: s.view,
        eaFilter: s.eaFilter,
        showDemoTag: s.showDemoTag,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      migrate: () => ({ portcos: loadDemoState(DEFAULT_STATE), mockMode: DEFAULT_MOCK, loggedIn: false }) as Partial<AppState>,
    },
  ),
);
