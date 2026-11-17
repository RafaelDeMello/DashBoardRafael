import Link from "next/link";
import { LayoutList, ListChecks, NotebookText, Settings, type LucideIcon } from "lucide-react";
import type { NavKey } from "@/components/day/sidebar";

const TABS: { key: NavKey; label: string; icon: LucideIcon; href: string }[] = [
  { key: "tasks", label: "Tasks", icon: ListChecks, href: "/" },
  { key: "modelos", label: "Modelos", icon: LayoutList, href: "/modelos" },
  { key: "notas", label: "Notas", icon: NotebookText, href: "/notas" },
  { key: "configuracoes", label: "Config.", icon: Settings, href: "/configuracoes" },
];

/** Barra inferior do celular (no computador quem navega é o menu lateral). */
export function MobileNav({ active }: { active: NavKey }) {
  return (
    <nav
      aria-label="Principal"
      className="relative z-30 flex flex-none border-t border-[#1d2430] bg-[#0b0d11] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TABS.map(({ key, label, icon: Icon, href }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-[58px] flex-1 flex-col items-center justify-center border-t-2 font-retro text-[16px] uppercase tracking-[0.06em] transition-colors ${
              isActive
                ? "border-[#19e6ff] bg-[#16283d] text-[#19e6ff]"
                : "border-transparent text-[#8d96a6] active:bg-[#151926]"
            }`}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
