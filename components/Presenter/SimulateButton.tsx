"use client";

// A visible demo control inside a waiting state. Styled as a presenter
// control so the room can tell it apart from the EA's buttons.

import { useStore } from "@/lib/store";

export function SimulateButton({ label, onClick, testId, disabled }: { label: string; onClick: () => void; testId: string; disabled?: boolean }) {
  const show = useStore((s) => s.showDemoButtons);
  const working = useStore((s) => s.working);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !!working}
      data-testid={testId}
      className="rounded-md border border-dashed border-amber/60 bg-amber-soft/60 px-3 py-1.5 text-[12px] font-medium text-amber hover:bg-amber-soft disabled:cursor-not-allowed disabled:opacity-50"
    >
      Demo: {label}
    </button>
  );
}
