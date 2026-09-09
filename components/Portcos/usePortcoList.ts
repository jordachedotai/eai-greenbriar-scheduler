"use client";

// The list the Portcos page shows: filtered by EA and by the work strip.

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { getCurrentEa } from "@/lib/data";
import { boardMembersOf, bucketOf, workCounts, type WorkCounts } from "@/lib/pipeline";
import type { Portco } from "@/lib/types";

export function usePortcoList(): { list: Portco[]; visible: Portco[]; counts: WorkCounts } {
  const portcos = useStore((s) => s.portcos);
  const eaFilter = useStore((s) => s.eaFilter);
  const workFilter = useStore((s) => s.workFilter);
  return useMemo(() => {
    const me = getCurrentEa().id;
    const list = Object.values(portcos).filter((p) => eaFilter === "all" || p.eaId === me);
    const counts = workCounts(list, (id) => boardMembersOf(portcos[id]));
    const visible = workFilter ? list.filter((p) => bucketOf(p, boardMembersOf(p)) === workFilter) : list;
    return { list, visible, counts };
  }, [portcos, eaFilter, workFilter]);
}
