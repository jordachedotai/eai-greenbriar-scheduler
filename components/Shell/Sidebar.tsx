"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { getCurrentEa } from "@/lib/data";
import { Face } from "@/components/ui/Face";
import { IconCalendar, IconChevronLeft, IconPeople, IconPortfolio, IconSettings, IconTemplates } from "@/components/ui/icons";

const ITEMS = [
  { href: "/portfolio", label: "Portfolio", Icon: IconPortfolio },
  { href: "/calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/people", label: "People", Icon: IconPeople },
  { href: "/templates", label: "Templates", Icon: IconTemplates },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

export function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const setCollapsed = useStore((s) => s.setSidebarCollapsed);
  const pathname = usePathname();
  const ea = getCurrentEa();
  return (
    <aside
      className={"flex shrink-0 flex-col justify-between border-r border-line bg-panel transition-[width] " + (collapsed ? "w-[64px]" : "w-[232px]")}
      data-testid="sidebar"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className="flex flex-col">
        <div className={"flex h-[64px] items-center border-b border-line " + (collapsed ? "justify-center" : "px-5")}>
          {collapsed ? (
            <span className="serif text-[20px] font-semibold text-brand">G</span>
          ) : (
            <Image src="/greenbriar-logo.png" alt="Greenbriar" width={134} height={22} priority />
          )}
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={label}
                data-testid={`nav-${label.toLowerCase()}`}
                className={
                  "flex h-11 items-center gap-3 rounded-[10px] px-3 text-[16px] " +
                  (active ? "bg-brand-soft font-semibold text-brand2" : "font-medium text-txt hover:bg-panel2") +
                  (collapsed ? " justify-center px-0" : "")
                }
              >
                <Icon size={20} stroke={active ? "currentColor" : "#61705f"} />
                {!collapsed ? <span>{label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className={"flex flex-col gap-2.5 border-t border-line " + (collapsed ? "items-center px-2 py-3" : "px-4 pb-4 pt-3.5")} data-testid="avatar">
        <div className="flex items-center gap-3">
          <Face person={{ id: ea.id, name: ea.name, avatar: ea.avatar }} size={40} className="shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#dde3da]" />
          {!collapsed ? (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-semibold">{ea.name}</div>
              <div className="truncate text-[13px] text-mut">{ea.title}</div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-[13px] text-mut hover:text-txt"
          data-testid="sidebar-toggle"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <IconChevronLeft size={14} className={collapsed ? "rotate-180" : ""} />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}
