"use client";

// A menu in place of a native select: a button showing the current value,
// a list of options beneath it. Same everywhere in the tool. `dark` is
// for the presenter menu.

import { useEffect, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "./icons";

export type MenuOption<T extends string | number> = { value: T; label: string; sub?: string };

export function Menu<T extends string | number>({
  value,
  options,
  onChange,
  testId,
  className = "",
  placeholder = "Choose",
  dark = false,
  defaultOpen = false,
  onClose,
  ariaLabel,
}: {
  value: T | null | undefined;
  options: MenuOption<T>[];
  onChange: (v: T) => void;
  testId: string;
  className?: string;
  placeholder?: string;
  dark?: boolean;
  defaultOpen?: boolean;
  onClose?: () => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  const trigger = dark
    ? "inline-flex items-center gap-1.5 rounded-[6px] bg-white/12 px-2.5 py-1 text-[13px] text-white hover:bg-white/20"
    : "inline-flex h-10 w-full items-center justify-between gap-2 rounded-[8px] border border-line bg-white px-3 text-left text-[15px] text-txt hover:border-brand";
  const list = dark
    ? "absolute right-0 z-40 mt-1 min-w-[180px] rounded-[8px] border border-white/15 bg-[#1d2a20] py-1 text-[13px] text-white shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]"
    : "absolute left-0 z-40 mt-1 max-h-[300px] min-w-full overflow-y-auto rounded-[10px] border border-line bg-white py-1 text-[15px] text-txt shadow-[var(--shadow-card-hover)]";
  const item = dark ? "hover:bg-white/12" : "hover:bg-bg";

  return (
    <div ref={ref} className={"relative " + className}>
      <button type="button" className={trigger} onClick={() => (open ? close() : setOpen(true))} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} data-testid={testId} data-value={value == null ? "" : String(value)}>
        <span className={"truncate " + (current ? "" : dark ? "text-white/70" : "text-mut")}>{current?.label ?? placeholder}</span>
        <IconChevronDown size={12} className="shrink-0 opacity-70" />
      </button>
      {open ? (
        <ul role="listbox" className={list} data-testid={`${testId}-list`}>
          {options.map((o) => {
            const on = o.value === value;
            return (
              <li key={String(o.value)} role="option" aria-selected={on}>
                <button
                  type="button"
                  className={"flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left " + item + (on ? " font-semibold" : "")}
                  onClick={() => {
                    onChange(o.value);
                    close();
                  }}
                  data-testid={`${testId}-opt-${o.value}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{o.label}</span>
                    {o.sub ? <span className={"block truncate text-[12px] " + (dark ? "text-white/60" : "text-mut")}>{o.sub}</span> : null}
                  </span>
                  {on ? <IconCheck size={12} className="shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
