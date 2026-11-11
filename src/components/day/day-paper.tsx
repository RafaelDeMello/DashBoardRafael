import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Check, Plus, Sun, X } from "lucide-react";
import {
  addItemAction,
  addSectionAction,
  createDayAction,
  deleteItemAction,
  deleteSectionAction,
  toggleItemAction,
} from "@/app/actions";
import { addDays, formatTitle } from "@/lib/date";
import type { DayData, SectionData } from "@/lib/days";

const dm = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

function ProgressStrip({
  done,
  total,
  className = "",
}: {
  done: number;
  total: number;
  className?: string;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className={`mb-4 flex items-center gap-2.5 rounded-[10px] bg-[#f7f7f5] px-4 py-3 text-xs text-[#787774] ${className}`}
    >
      <div className="h-2 flex-1 rounded bg-[#e6e5e2]">
        <div className="h-2 rounded bg-[#2f6a96]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[15px] text-[#2f2f2c]">{pct}%</span>
      <span>
        {done} de {total}
      </span>
    </div>
  );
}

function Section({ section }: { section: SectionData }) {
  const done = section.items.filter((i) => i.done).length;
  return (
    <details open className="group/s mt-3 first:mt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-0.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5 text-[15px] font-medium">
          <ChevronDown
            size={14}
            className="-rotate-90 text-[#9b9a97] transition-transform group-open/s:rotate-0"
          />
          {section.title}
        </span>
        <span className="text-xs text-[#9b9a97]">
          {done} de {section.items.length}
        </span>
      </summary>

      <ul>
        {section.items.map((item) => (
          <li key={item.id} className="group/i flex items-center gap-2.5 py-1 text-sm">
            <form action={toggleItemAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="done" value={String(!item.done)} />
              <button
                type="submit"
                aria-label={item.done ? `Desmarcar: ${item.title}` : `Marcar como feito: ${item.title}`}
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
                  item.done
                    ? "border-[#2f6a96] bg-[#2f6a96] text-white"
                    : "border-[#9b9a97] hover:border-[#2f6a96]"
                }`}
              >
                {item.done && <Check size={12} strokeWidth={3} />}
              </button>
            </form>
            <span className={item.done ? "text-[#9b9a97] line-through" : ""}>{item.title}</span>
            <form
              action={deleteItemAction}
              className="ml-auto md:opacity-0 md:focus-within:opacity-100 md:group-hover/i:opacity-100"
            >
              <input type="hidden" name="itemId" value={item.id} />
              <button
                type="submit"
                aria-label={`Remover: ${item.title}`}
                className="rounded p-0.5 text-[#b8b7b4] hover:bg-[#f1f1ef] hover:text-[#c0392b]"
              >
                <X size={14} />
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={addItemAction} className="flex items-center gap-2.5 py-1">
        <input type="hidden" name="sectionId" value={section.id} />
        <Plus size={18} className="text-[#b8b7b4]" />
        <input
          name="title"
          required
          maxLength={200}
          autoComplete="off"
          placeholder="Novo item"
          className="w-full bg-transparent text-sm text-[#37352f] outline-none placeholder:text-[#b8b7b4] focus:placeholder:text-[#9b9a97]"
        />
      </form>

      <details className="mt-0.5">
        <summary className="w-fit cursor-pointer list-none text-xs text-[#c4c3c0] hover:text-[#9b9a97] [&::-webkit-details-marker]:hidden">
          Excluir seção
        </summary>
        <form action={deleteSectionAction} className="mt-1 flex items-center gap-3 text-xs text-[#787774]">
          <input type="hidden" name="sectionId" value={section.id} />
          <span>
            Apaga “{section.title}” e {section.items.length === 1 ? "o item" : `os ${section.items.length} itens`}{" "}
            dela.
          </span>
          <button type="submit" className="rounded border border-[#e0b4ae] px-2 py-0.5 text-[#c0392b] hover:bg-[#fdf1ef]">
            Confirmar
          </button>
        </form>
      </details>
    </details>
  );
}

export function DayPaper({
  date,
  today,
  day,
  previousDate,
  menuExpanded,
}: {
  date: string;
  today: string;
  day: DayData | null;
  previousDate: string | null;
  menuExpanded: boolean;
}) {
  const total = day?.sections.reduce((n, s) => n + s.items.length, 0) ?? 0;
  const done = day?.sections.reduce((n, s) => n + s.items.filter((i) => i.done).length, 0) ?? 0;

  return (
    <article className="min-w-0 flex-1 overflow-y-auto rounded-t-lg bg-white px-5 py-6 text-[#37352f] md:px-[30px]">
      <div className="mb-2.5 flex items-center justify-between text-xs text-[#9b9a97]">
        <span>Only-Tasks</span>
        <nav className="flex items-center gap-1.5" aria-label="Navegar entre dias">
          <Link href={`/?d=${addDays(date, -1)}`} aria-label="Dia anterior" className="rounded p-0.5 hover:bg-[#f1f1ef]">
            <ChevronLeft size={16} />
          </Link>
          {date === today ? (
            <span className="text-[#37352f]">Hoje</span>
          ) : (
            <Link href="/" className="text-[#2f6a96] hover:underline">
              Ir para hoje
            </Link>
          )}
          <Link href={`/?d=${addDays(date, 1)}`} aria-label="Próximo dia" className="rounded p-0.5 hover:bg-[#f1f1ef]">
            <ChevronRight size={16} />
          </Link>
        </nav>
      </div>

      <Sun size={28} className="text-[#2f6a96]" />
      <h1 className="mb-3 mt-1.5 text-[28px] font-medium leading-tight text-[#2f2f2c]">{formatTitle(date)}</h1>

      <div className="mb-3.5 flex gap-[18px] border-b border-[#ededeb] text-sm">
        <span className="-mb-px border-b-2 border-[#2f6a96] pb-[7px] text-[#2f6a96]">Dia</span>
        <span className="cursor-not-allowed pb-[7px] text-[#c4c3c0]" title="Em breve">
          Semana
        </span>
        <span className="cursor-not-allowed pb-[7px] text-[#c4c3c0]" title="Em breve">
          Mês
        </span>
      </div>

      {!day ? (
        <div className="mt-6 rounded-lg bg-[#f7f7f5] p-6 text-center">
          <p className="text-sm text-[#787774]">Este dia ainda não tem lista.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {previousDate && (
              <form action={createDayAction}>
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="mode" value="copy" />
                <button
                  type="submit"
                  className="rounded-md bg-[#2f6a96] px-4 py-2 text-sm text-white transition-colors hover:bg-[#285a80]"
                >
                  Copiar o dia {dm(previousDate)}
                </button>
              </form>
            )}
            <form action={createDayAction}>
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="mode" value="empty" />
              <button
                type="submit"
                className="rounded-md border border-[#dcdbd8] px-4 py-2 text-sm transition-colors hover:bg-[#f1f1ef]"
              >
                Começar do zero
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Só aparece quando o cartão de resumo está oculto (mesmos pontos de corte da página) */}
          <ProgressStrip
            done={done}
            total={total}
            className={menuExpanded ? "min-[1536px]:hidden" : "lg:hidden"}
          />

          {day.sections.length === 0 && (
            <p className="mb-3 text-sm text-[#9b9a97]">
              Comece adicionando uma seção, por exemplo “Manhã”.
            </p>
          )}

          {day.sections.map((s) => (
            <Section key={s.id} section={s} />
          ))}

          <form action={addSectionAction} className="mt-5 flex items-center gap-2.5 border-t border-[#ededeb] pt-3">
            <input type="hidden" name="listId" value={day.id} />
            <Plus size={18} className="text-[#b8b7b4]" />
            <input
              name="title"
              required
              maxLength={200}
              autoComplete="off"
              placeholder="Nova seção (ex.: Manhã)"
              className="w-full bg-transparent text-sm text-[#37352f] outline-none placeholder:text-[#b8b7b4] focus:placeholder:text-[#9b9a97]"
            />
          </form>
        </>
      )}
    </article>
  );
}
