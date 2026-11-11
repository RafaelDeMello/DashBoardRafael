import { Flame } from "lucide-react";

export type SectionSummary = { id: string; title: string; done: number; total: number };

const SEGMENTS = 20;

/** Cartão "RESUMO.SYS": só aparece com o menu recolhido (e em telas largas). */
export function SummaryCard({
  done,
  total,
  sections,
  streakDays,
}: {
  done: number;
  total: number;
  sections: SectionSummary[];
  streakDays: number;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const filled = Math.round((pct / 100) * SEGMENTS);

  return (
    <div className="rounded border-2 border-[#3a4256] bg-[#12141a] shadow-[4px_4px_0_rgba(111,168,214,0.18)]">
      <div className="flex justify-between border-b-2 border-[#3a4256] bg-[#1b1e27] px-2.5 py-0.5 font-retro text-[21px] tracking-[0.14em] text-[#9ccaf0]">
        <span>RESUMO.SYS</span>
        <span aria-hidden className="self-center text-xs tracking-[0.3em] text-[#6f778a]">
          ■ ■
        </span>
      </div>

      <div className="p-3">
        <div className="font-retro text-lg tracking-[0.12em] text-[#8b93a5]">PROGRESSO</div>
        <div className="mb-2.5 mt-0.5 text-[32px] font-medium leading-tight text-[#f4f6fb]">{pct}%</div>

        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${SEGMENTS}, 1fr)` }}
          role="img"
          aria-label={`${pct}% concluído`}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <i key={i} className={`block h-3 ${i < filled ? "bg-[#6fa8d6]" : "bg-[#1b1e27]"}`} />
          ))}
        </div>
        <div className="mt-[7px] text-xs text-[#8b93a5]">
          {done} de {total} {total === 1 ? "item" : "itens"}
        </div>

        {sections.length > 0 && (
          <>
            <div className="my-3.5 h-px bg-[#2a2f3d]" />
            <div className="flex flex-col gap-[11px] text-[13px] text-[#c9cfdb]">
              {sections.map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{s.title}</span>
                    <span className="flex-none text-[#8b93a5]">
                      {s.done}/{s.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-[#1b1e27]">
                    <div
                      className="h-1.5 bg-[#6fa8d6]"
                      style={{ width: `${s.total ? Math.round((s.done / s.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="my-3.5 h-px bg-[#2a2f3d]" />
        <div className="flex items-center gap-[7px] text-[13px] text-[#c9cfdb]">
          <Flame size={16} className="text-[#c9a86a]" />
          {streakDays} {streakDays === 1 ? "dia seguido" : "dias seguidos"}
        </div>
      </div>
    </div>
  );
}
