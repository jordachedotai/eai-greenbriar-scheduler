"use client";

// Client state. Persists to localStorage so a rehearsal can be resumed.
// Reset loads the room default state, `council`.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BoardMember, LogActor, Portco, PortcoSeed, Venue } from "./types";
import type { Bucket } from "./pipeline";
import { hydratePortco, loadDemoState, setExtraBoardMembers, setExtraVenues } from "./data";
import { nowIso } from "./pipeline";

export const STORE_VERSION = 7; // 7: every window carries a reason, the shortlist is editable. 6: skippedDays on the company. 5: quarter keys became YYYY-Qn (planning windows)
export const DEFAULT_STATE = "council";

const DEFAULT_MOCK = process.env.MOCK_MODE !== "false";

export type View = "rows" | "board";
export type EaFilter = "mine" | "all";

export type AppState = {
  portcos: Record<string, Portco>;
  customVenues: Venue[];
  mockMode: boolean;
  loggedIn: boolean;
  view: View;
  eaFilter: EaFilter;
  workFilter: Bucket | null;
  showDemoTag: boolean;
  sidebarCollapsed: boolean;
  presenterOpen: boolean;
  working: { portcoId: string; label: string } | null;
  viewEmail: { portcoId: string; replyId?: string; draftKey?: string; modal?: boolean; title?: string } | null;

  updatePortco: (id: string, fn: (p: Portco) => Portco) => void;
  addPortco: (seed: PortcoSeed, boardMembers: BoardMember[]) => void;
  setTeam: (id: string, partnerIds: string[]) => void;
  setEa: (id: string, eaId: string) => void;
  addVenue: (v: Venue) => void;
  defaults: { quarterCount: number; blockHours: number; dinnerTime: string };
  setDefaults: (d: Partial<{ quarterCount: number; blockHours: number; dinnerTime: string }>) => void;
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
  setViewEmail: (v: { portcoId: string; replyId?: string; draftKey?: string; modal?: boolean; title?: string } | null) => void;
  loadState: (name: string) => void;
  reset: () => void;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      portcos: loadDemoState(DEFAULT_STATE),
      customVenues: [],
      defaults: { quarterCount: 4, blockHours: 4, dinnerTime: "18:30" },
      mockMode: DEFAULT_MOCK,
      loggedIn: false,
      view: "rows",
      eaFilter: "mine",
      workFilter: null,
      showDemoTag: true,
      sidebarCollapsed: false,
      presenterOpen: false,
      working: null,
      viewEmail: null,

      updatePortco: (id, fn) =>
        set((s) => (s.portcos[id] ? { portcos: { ...s.portcos, [id]: fn(s.portcos[id]) } } : {})),
      addPortco: (seed, boardMembers) =>
        set((s) => {
          const p: Portco = { ...hydratePortco(seed), boardMembers };
          p.log = [{ at: nowIso(), actor: "ea", text: `Added ${seed.name} in Settings.` }];
          return { portcos: { ...s.portcos, [seed.id]: p } };
        }),
      setTeam: (id, partnerIds) =>
        set((s) => {
          const p = s.portcos[id];
          if (!p || partnerIds.length === 0) return {};
          const checked = (p.checkedPartnerIds ?? p.partnerIds).filter((x) => partnerIds.includes(x));
          const next: Portco = { ...p, partnerIds, checkedPartnerIds: checked.length ? checked : undefined };
          next.log = [...p.log, { at: nowIso(), actor: "ea", text: "Changed the Greenbriar team in Settings." }];
          return { portcos: { ...s.portcos, [id]: next } };
        }),
      setEa: (id, eaId) => set((s) => (s.portcos[id] ? { portcos: { ...s.portcos, [id]: { ...s.portcos[id], eaId } } } : {})),
      addVenue: (v) => set((s) => ({ customVenues: [...s.customVenues.filter((x) => x.id !== v.id), v] })),
      setDefaults: (d) => set((s) => ({ defaults: { ...s.defaults, ...d } })),
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
      setViewEmail: (viewEmail) => set({ viewEmail }),
      loadState: (name) => set({ portcos: loadDemoState(name), working: null, workFilter: null }),
      reset: () => set({ portcos: loadDemoState(DEFAULT_STATE), working: null, workFilter: null, view: "rows", eaFilter: "mine" }),
    }),
    {
      name: "greenbriar-scheduler",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        portcos: s.portcos,
        customVenues: s.customVenues,
        defaults: s.defaults,
        mockMode: s.mockMode,
        loggedIn: s.loggedIn,
        view: s.view,
        eaFilter: s.eaFilter,
        showDemoTag: s.showDemoTag,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      migrate: () => ({ portcos: loadDemoState(DEFAULT_STATE), mockMode: DEFAULT_MOCK, loggedIn: false }) as Partial<AppState>,
      // Never let a stale or hand-edited store crash the page. If any saved
      // company carries a quarter key that is not YYYY-Qn, drop the saved
      // companies and start from the demo state, keeping the harmless prefs.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        const valid = Object.values(saved.portcos ?? {}).every((pc) =>
          Object.keys((pc as Portco).quarters ?? {}).every((k) => /^\d{4}-Q[1-4]$/.test(k)),
        );
        if (!valid) {
          const { portcos: _drop, customVenues: _venues, ...prefs } = saved;
          return { ...current, ...prefs, portcos: loadDemoState(DEFAULT_STATE) };
        }
        return { ...current, ...saved };
      },
    },
  ),
);

// Board members of added companies live on the record; register them so
// names resolve through lib/data.
function syncExtra(portcos: Record<string, Portco>, venues: Venue[]) {
  setExtraBoardMembers(Object.values(portcos).flatMap((p) => p.boardMembers ?? []));
  setExtraVenues(venues);
}
syncExtra(useStore.getState().portcos, useStore.getState().customVenues ?? []);
useStore.subscribe((s) => syncExtra(s.portcos, s.customVenues ?? []));
