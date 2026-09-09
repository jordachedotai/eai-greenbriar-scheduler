"use client";

// The header band. Dark green, serif title, view and assistant toggles.
// On a company page: breadcrumb, demo tag, presenter button.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { IconChevronRight, IconPresenter } from "@/components/ui/icons";

const TITLES: Record<string, string> = {
  "/portfolio": "Portfolio",
  "/calendar": "Calendar",
  "/people": "People",
  "/templates": "Templates",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const isDetail = base === "/portfolio" && pathname !== "/portfolio";
  const detailName = useStore((s) => (isDetail ? s.portcos[pathname.split("/")[2]]?.name : undefined));
  const mockMode = useStore((s) => s.mockMode);
  const showDemoTag = useStore((s) => s.showDemoTag);
  const setPresenterOpen = useStore((s) => s.setPresenterOpen);
  const presenterOpen = useStore((s) => s.presenterOpen);

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between bg-header px-7 text-white">
      {isDetail ? (
        <div className="flex items-center gap-2.5 text-[16px]">
          <Link href="/portfolio" className="text-white/72 hover:text-white">Portfolio</Link>
          <IconChevronRight size={14} stroke="rgba(255,255,255,0.5)" />
          <span className="serif text-[22px] font-semibold" data-testid="header-title">{detailName ?? ""}</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-3.5">
          <span className="serif text-[24px] font-semibold tracking-[-0.01em]" data-testid="header-title">{TITLES[base] ?? "Greenbriar"}</span>
          <span className="text-[15px] text-white/72">Quarterly meetings, 2027</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        {base === "/portfolio" && !isDetail ? <ViewToggle /> : null}
        {(base === "/portfolio" && !isDetail) || base === "/calendar" ? <EaFilter /> : null}
        {showDemoTag ? (
          <span className="rounded-full bg-white/12 px-2.5 py-1 text-[13px] font-medium text-white/90" data-testid="mode-tag">
            {mockMode ? "Demo data" : "Live agent"}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setPresenterOpen(!presenterOpen)}
          title="Presenter menu (Shift+P)"
          data-testid="presenter-toggle"
          className={"inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] " + (presenterOpen ? "bg-white text-header" : "bg-white/12 text-white hover:bg-white/20")}
        >
          <IconPresenter size={16} />
        </button>
      </div>
    </header>
  );
}

function Toggle<T extends string>({ value, options, onChange, testPrefix, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; testPrefix: string; label: string }) {
  return (
    <div className="flex items-center rounded-[8px] border border-white/18 bg-white/10 p-[3px]" role="tablist" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          data-testid={`${testPrefix}-${v}`}
          className={"rounded-[6px] px-3 py-[5px] text-[14px] " + (value === v ? "bg-white font-semibold text-header" : "font-medium text-white/85 hover:text-white")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function ViewToggle() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  return <Toggle value={view} options={[["rows", "Rows"], ["board", "Board"]]} onChange={setView} testPrefix="view" label="View" />;
}

export function EaFilter() {
  const eaFilter = useStore((s) => s.eaFilter);
  const setEaFilter = useStore((s) => s.setEaFilter);
  return <Toggle value={eaFilter} options={[["mine", "My companies"], ["all", "All assistants"]]} onChange={setEaFilter} testPrefix="ea" label="Assistant filter" />;
}
