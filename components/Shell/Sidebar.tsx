"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { getCurrentEa } from "@/lib/data";

const ITEMS = [
  { href: "/portcos", label: "Portcos", icon: "▤" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/people", label: "People", icon: "◉" },
  { href: "/templates", label: "Templates", icon: "▭" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const setCollapsed = useStore((s) => s.setSidebarCollapsed);
  const pathname = usePathname();
  const ea = getCurrentEa();
  return (
    <aside
      className={"flex shrink-0 flex-col border-r border-line bg-panel transition-[width] " + (collapsed ? "w-[56px]" : "w-[220px]")}
      data-testid="sidebar"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className={"flex h-[56px] items-center border-b border-line " + (collapsed ? "justify-center" : "px-4")}>
        {collapsed ? (
          <span className="font-serif text-[18px] font-bold text-brand">G</span>
        ) : (
          <Image src="/greenbriar-logo.png" alt="Greenbriar" width={140} height={23} priority />
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {ITEMS.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              title={it.label}
              data-testid={`nav-${it.label.toLowerCase()}`}
              className={
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] " +
                (active ? "bg-brand-soft font-medium text-brand" : "text-txt hover:bg-panel2") +
                (collapsed ? " justify-center" : "")
              }
            >
              <span className="w-4 text-center text-[13px] opacity-70">{it.icon}</span>
              {!collapsed ? <span>{it.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-1 rounded px-2 py-1 text-left text-[11px] text-mut hover:text-txt"
        data-testid="sidebar-toggle"
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? "»" : "« Collapse"}
      </button>
      <div className={"flex items-center gap-2.5 border-t border-line p-3 " + (collapsed ? "justify-center" : "")} data-testid="avatar">
        {ea.avatar ? (
          <Image
            src={ea.avatar}
            alt={ea.name}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover object-top"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-white">
            {ea.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
        )}
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12.5px] font-medium">{ea.name}</div>
            <div className="truncate text-[11px] text-mut">{ea.title}, Greenbriar</div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
