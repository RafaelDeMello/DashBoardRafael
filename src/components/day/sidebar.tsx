import Link from "next/link";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutList,
  ListChecks,
  LogOut,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { setMenuAction } from "@/app/actions";
import { logout } from "@/app/login/actions";
import type { DayProgress } from "@/lib/progress";
import { MonthCalendar } from "./month-calendar";

export type NavKey = "tasks" | "modelos" | "configuracoes";

// Ordem dos módulos no menu
const NAV: { key: NavKey; label: string; icon: LucideIcon; href: string }[] = [
  { key: "tasks", label: "TASKS", icon: ListChecks, href: "/" },
  { key: "modelos", label: "MODELOS", icon: LayoutList, href: "/modelos" },
  { key: "configuracoes", label: "CONFIGURAÇÕES", icon: Settings, href: "/configuracoes" },
];

export function Sidebar({
  active,
  expanded,
  date,
  progress,
}: {
  active: NavKey;
  expanded: boolean;
  date: string;
  progress: Record<string, DayProgress>;
}) {
  const handleLabel = expanded ? "Recolher menu" : "Expandir menu";

  return (
    <aside
      className={`relative z-30 flex-none border-r border-[#1e222c] py-[18px] text-[#8b93a5] ${
        expanded
          ? "w-[212px] max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:bg-[#0a0a0f]"
          : "w-[58px]"
      }`}
    >
      {/* Alça na borda do menu: sempre no mesmo lugar, com setas */}
      <form action={setMenuAction}>
        <input type="hidden" name="expanded" value={String(!expanded)} />
        <button
          type="submit"
          title={handleLabel}
          aria-label={handleLabel}
          className="absolute -right-[13px] top-[22px] z-40 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[#3a4256] bg-[#1d2230] text-[#c9cfdb] transition-colors hover:border-[#6fa8d6] hover:text-white"
        >
          {expanded ? <ChevronsLeft size={15} /> : <ChevronsRight size={15} />}
        </button>
      </form>

      <div className={`flex h-full flex-col ${expanded ? "px-3.5" : "items-center"}`}>
        <div className={expanded ? "mb-4 pl-1" : "mb-3.5"}>
          <span className="font-pixel text-[11px] text-[#f4f6fb] [text-shadow:2px_2px_0_#2f6a96]">
            OT
          </span>
        </div>

        <nav className={`flex flex-col gap-0.5 ${expanded ? "" : "items-center"}`} aria-label="Principal">
          {NAV.map(({ key, label, icon: Icon, href }) => {
            const isActive = key === active;
            const base = expanded
              ? "flex items-center gap-2.5 rounded px-2.5 py-0.5 font-retro text-[20px] tracking-[0.06em]"
              : "flex h-[38px] w-[38px] items-center justify-center rounded";
            const state = isActive
              ? "border-l-[3px] border-[#6fa8d6] bg-[#1d2230] text-[#e9ecf3]"
              : "hover:bg-[#151926] hover:text-[#c9cfdb]";
            return (
              <Link
                key={key}
                href={href}
                title={label}
                aria-current={isActive ? "page" : undefined}
                className={`${base} ${state}`}
              >
                <Icon size={expanded ? 17 : 20} className={isActive ? "text-[#9ccaf0]" : ""} />
                {expanded && label}
              </Link>
            );
          })}
        </nav>

        {expanded && (
          <div className="mt-[18px] pl-1">
            <MonthCalendar date={date} progress={progress} />
          </div>
        )}

        <div className={`mt-auto flex flex-col gap-2 ${expanded ? "pl-1" : "items-center"}`}>
          {expanded && (
            <form action={setMenuAction}>
              <input type="hidden" name="expanded" value="false" />
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-[#6f778a] hover:text-[#c9cfdb]"
              >
                <ChevronsLeft size={14} />
                Recolher menu
              </button>
            </form>
          )}
          <form action={logout}>
            <button
              type="submit"
              title="Sair"
              className={`flex items-center gap-2 text-[13px] hover:text-white ${
                expanded ? "" : "h-[38px] w-[38px] justify-center"
              }`}
            >
              <LogOut size={expanded ? 18 : 20} />
              {expanded && "Sair"}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
