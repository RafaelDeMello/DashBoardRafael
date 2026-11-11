import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  ChevronsLeft,
  ChevronsRight,
  LayoutList,
  ListChecks,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { setMenuAction } from "@/app/actions";
import { logout } from "@/app/login/actions";
import type { DayProgress } from "@/lib/progress";
import { MonthCalendar } from "./month-calendar";

const NAV: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "DIA", icon: ListChecks, href: "/" },
  { label: "SEMANA", icon: CalendarDays },
  { label: "MÊS", icon: CalendarRange },
  { label: "MODELOS", icon: LayoutList },
];

export function Sidebar({
  expanded,
  date,
  progress,
}: {
  expanded: boolean;
  date: string;
  progress: Record<string, DayProgress>;
}) {
  const handleLabel = expanded ? "Recolher menu" : "Expandir menu";

  return (
    <aside
      className={`relative z-30 flex-none border-r border-[#1e222c] py-[18px] text-[#8b93a5] ${
        expanded
          ? "w-[196px] max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:bg-[#0a0a0f]"
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
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = !!href;
            const base = expanded
              ? "flex items-center gap-2.5 rounded px-2.5 py-0.5 font-retro text-[21px] tracking-[0.08em]"
              : "flex h-[38px] w-[38px] items-center justify-center rounded";
            const state = active
              ? "border-l-[3px] border-[#6fa8d6] bg-[#1d2230] text-[#e9ecf3]"
              : "opacity-50";
            const icon = <Icon size={expanded ? 17 : 20} className={active ? "text-[#9ccaf0]" : ""} />;
            return href ? (
              <Link key={label} href={href} title={label} className={`${base} ${state}`}>
                {icon}
                {expanded && label}
              </Link>
            ) : (
              <span
                key={label}
                title={`${label} (em breve)`}
                aria-disabled="true"
                className={`${base} ${state} cursor-not-allowed`}
              >
                {icon}
                {expanded && label}
              </span>
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
