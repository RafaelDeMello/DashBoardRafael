import Link from "next/link";
import { monthGrid } from "@/lib/date";
import { level, percent, type DayProgress } from "@/lib/progress";

// Estilo "contribuições do GitHub": verde mais vivo = mais tarefas feitas.
const COLORS = ["transparent", "#0e4429", "#006d32", "#26a641", "#39d353"];
const EMPTY_BORDER = "1px solid rgba(255,255,255,.08)";

export function MonthCalendar({
  date,
  progress,
}: {
  date: string;
  progress: Record<string, DayProgress>;
}) {
  const { label, cells } = monthGrid(date);

  return (
    // w-fit: o bloco tem a largura do título; grade e legenda ficam centralizadas sob ele
    <div className="flex w-fit flex-col items-center">
      <div className="mb-1.5 text-center font-retro text-[15px] tracking-[0.1em] text-[#6f778a] min-[1536px]:text-[17px]">
        {label}
      </div>

      <div
        className="grid gap-[var(--cal-gap)]"
        style={{ gridTemplateColumns: "repeat(7, var(--cal-cell))" }}
      >
        {cells.map((c, i) => {
          if (!c) return <span key={`vazio-${i}`} />;
          const pct = percent(progress[c]);
          const lv = level(pct);
          const [, mm, dd] = c.split("-");
          return (
            <Link
              key={c}
              href={`/?d=${c}`}
              prefetch={false}
              aria-label={`${dd}/${mm}: ${pct}% concluído`}
              title={`${dd}/${mm} · ${pct}%`}
              className="block h-[var(--cal-cell)] w-[var(--cal-cell)] rounded-[2px]"
              style={{
                background: COLORS[lv],
                border: lv ? undefined : EMPTY_BORDER,
                outline: c === date ? "1px solid #f4f6fb" : undefined,
                outlineOffset: 1,
              }}
            />
          );
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-[3px] text-[10px] text-[#6f778a] min-[1536px]:text-[11px]">
        menos
        {COLORS.map((color, i) => (
          <i
            key={color}
            className="inline-block h-[var(--cal-cell)] w-[var(--cal-cell)] rounded-[2px]"
            style={{ background: color, border: i ? undefined : EMPTY_BORDER }}
          />
        ))}
        mais
      </div>
    </div>
  );
}
