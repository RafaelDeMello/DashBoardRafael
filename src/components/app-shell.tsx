import { Starfield } from "@/components/starfield";
import { Sidebar, type NavKey } from "@/components/day/sidebar";
import type { DayProgress } from "@/lib/progress";

/** Casca comum às telas: fundo de universo + menu lateral + área principal. */
export function AppShell({
  active,
  expanded,
  date,
  progress,
  aside,
  children,
}: {
  active: NavKey;
  expanded: boolean;
  date: string;
  progress: Record<string, DayProgress>;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <Starfield />
      <Sidebar active={active} expanded={expanded} date={date} progress={progress} />
      <main className="relative z-10 flex min-w-0 flex-1 gap-5 px-3 pt-5 md:px-5">
        {children}
        {aside}
      </main>
    </div>
  );
}

/** Folha branca simples para telas que ainda não foram construídas. */
export function ComingSoon({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="min-w-0 flex-1 overflow-y-auto rounded-t-lg bg-white px-5 py-6 text-[#37352f] md:px-[30px]">
      <div className="mb-3 text-xs text-[#9b9a97]">Only-Tasks</div>
      <h1 className="mb-4 text-[28px] font-medium leading-tight text-[#2f2f2c]">{title}</h1>
      <div className="rounded-lg bg-[#f7f7f5] p-6 text-sm text-[#787774]">{children}</div>
    </article>
  );
}
