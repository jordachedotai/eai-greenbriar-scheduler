"use client";

// Shared state for one open portco: which draft is being edited, and which
// done step the EA is looking at read-only.

import { createContext, useContext } from "react";
import type { BoardMember, Portco, Stage } from "@/lib/types";
import type { Phase } from "@/lib/pipeline";

export type DetailState = {
  portco: Portco;
  members: BoardMember[];
  stage: Stage;
  phase: Phase;
  working: string | null;
  editingKey: string | null;
  setEditingKey: (k: string | null) => void;
  viewStep: Stage | null; // a done step opened read-only
  setViewStep: (s: Stage | null) => void;
};

export const DetailContext = createContext<DetailState | null>(null);

export function useDetail(): DetailState {
  const v = useContext(DetailContext);
  if (!v) throw new Error("useDetail outside Detail");
  return v;
}
