"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const TITLES: Record<string, string> = {
  "/portcos": "Portcos",
  "/calendar": "Calendar",
  "/people": "People",
  "/templates": "Templates",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const isDetail = base === "/portcos" && pathname !== "/portcos";
  const detailName = useStore((s) => (isDetail ? s.portcos[pathname.split("/")[2]]?.name : undefined));
  const mockMode = useStore((s) => s.mockMode);
  const setPresenterOpen = useStore((s) => s.setPresenterOpen);
  const presenterOpen = useStore((s) => s.presenterOpen);

  return (
    <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-line bg-panel px-5">
      <div className="flex items-center gap-2 text-[15px] font-semibold">
        {isDetail ? (
          <>
            <Link href="/portcos" className="text-mut hover:text-txt">Portcos</Link>
            <span className="text-mut">/</span>
            <span data-testid="header-title">{detailName ?? ""}</span>
          </>
        ) : (
          <span data-testid="header-title">{TITLES[base] ?? "Greenbriar"}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {base === "/portcos" && !isDetail ? <ViewToggle /> : null}
        {(base === "/portcos" && !isDetail) || base === "/calendar" ? <EaFilter /> : null}
        <span className="rounded border border-line px-2 py-0.5 text-[11px] text-mut" data-testid="mode-tag">
          {mockMode ? "Demo data" : "Live agent"}
        </span>
        <button
          type="button"
          onClick={() => setPresenterOpen(!presenterOpen)}
          title="Presenter menu (Shift+P)"
          data-testid="presenter-toggle"
          className="rounded border border-line px-2 py-0.5 text-[11px] text-mut hover:text-txt"
        >
          ◐
        </button>
      </div>
    </header>
  );
}

export function ViewToggle() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  return (
    <div className="flex rounded-md border border-line p-0.5 text-[12px]" role="tablist" aria-label="View">
      {(["rows", "board"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={view === v}
          onClick={() => setView(v)}
          data-testid={`view-${v}`}
          className={"rounded px-2.5 py-1 " + (view === v ? "bg-brand text-white" : "text-mut hover:text-txt")}
        >
          {v === "rows" ? "Rows" : "Board"}
        </button>
      ))}
    </div>
  );
}

export function EaFilter() {
  const eaFilter = useStore((s) => s.eaFilter);
  const setEaFilter = useStore((s) => s.setEaFilter);
  return (
    <div className="flex rounded-md border border-line p-0.5 text-[12px]" role="tablist" aria-label="EA filter">
      {(["mine", "all"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={eaFilter === v}
          onClick={() => setEaFilter(v)}
          data-testid={`ea-${v}`}
          className={"rounded px-2.5 py-1 " + (eaFilter === v ? "bg-brand text-white" : "text-mut hover:text-txt")}
        >
          {v === "mine" ? "My portcos" : "All EAs"}
        </button>
      ))}
    </div>
  );
}
