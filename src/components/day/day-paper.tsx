import Link from "next/link";
import { ChevronLeft, ChevronRight, Sun, Undo2 } from "lucide-react";
import { createDayAction } from "@/app/actions";
import { addDays, dayOfMonth, formatTitle, formatWeekday } from "@/lib/date";
import type { DayData } from "@/lib/days";
import { DayBoard } from "./day-board";
import { DayMenu } from "./day-menu";
import { DayPicker } from "./day-picker";

const dm = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

// A faixa do topo é UMA barra contínua; cada segmento (card) tem uma informação.
// Os cards ficam encostados, separados só por um traço fino (border-l).
const LINE = "border-[#e3e2df]";
const SEG = "flex h-[58px] items-center justify-center transition-colors";

function CreateButton({
  date,
  mode,
  primary,
  children,
}: {
  date: string;
  mode: "template" | "copy" | "empty";
  primary: boolean;
  children: React.ReactNode;
}) {
  return (
    <form action={createDayAction}>
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="mode" value={mode} />
      <button
        type="submit"
        className={
          primary
            ? "rounded-md bg-[#2f6a96] px-4 py-2 text-sm text-white transition-colors hover:bg-[#285a80]"
            : "rounded-md border border-[#dcdbd8] px-4 py-2 text-sm transition-colors hover:bg-[#f1f1ef]"
        }
      >
        {children}
      </button>
    </form>
  );
}

/** A folha branca do dia: cabeçalho e navegação (servidor) + a lista interativa (cliente). */
export function DayPaper({
  date,
  today,
  day,
  previousDate,
  templateAvailable,
  menuExpanded,
  initialPermanent,
}: {
  date: string;
  today: string;
  day: DayData | null;
  previousDate: string | null;
  templateAvailable: boolean;
  menuExpanded: boolean;
  initialPermanent: boolean;
}) {
  return (
    <article className="min-w-0 flex-1 overflow-y-auto rounded-t-lg bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-[#37352f] md:px-[30px]">
      <div className="mb-3 flex items-center justify-between text-xs text-[#9b9a97]">
        <span>Only-Tasks</span>
        {day && <DayMenu key={date} date={date} />}
      </div>

      {/* [sol + dia da semana] [‹ ontem] [HOJE] [amanhã ›] [calendário]: cinco cards colados,
          com as duas pontas do mesmo tamanho para o trio de dias ficar no centro.
          (Sem overflow-hidden: o seletor de data abre para fora da barra.) */}
      {/* Cinco colunas exatamente iguais (minmax(0,1fr)): todos os cards têm o mesmo tamanho,
          e o trio de dias (2º, 3º e 4º) fica no centro. Encostados, sem espaço entre eles.
          (Sem overflow-hidden: o seletor de data abre para fora da barra.) */}
      <div>
        <div className={`grid w-full grid-cols-5 rounded-xl border ${LINE}`}>
          <div className={`${SEG} min-w-0 gap-2.5 rounded-l-[11px] px-2`}>
            <Sun size={22} className="flex-none text-[#2f6a96]" />
            <h1 className="hidden truncate text-[17px] font-medium text-[#2f2f2c] sm:block">
              {formatWeekday(date)}
              <span className="sr-only">, {formatTitle(date).split(", ")[1]}</span>
            </h1>
            {/* No celular só cabe o ícone; o nome do dia continua acessível */}
            <span className="sr-only sm:hidden">{formatWeekday(date)}</span>
          </div>

          <Link
            href={`/?d=${addDays(date, -1)}`}
            aria-label={`Dia anterior, ${dayOfMonth(addDays(date, -1))}`}
            className={`${SEG} min-w-0 gap-0.5 border-l ${LINE} text-[18px] text-[#787774] hover:bg-[#f7f7f5] sm:text-[22px]`}
          >
            <ChevronLeft size={16} className="hidden sm:block" />
            {dayOfMonth(addDays(date, -1))}
          </Link>

          <div
            aria-current="date"
            className={`${SEG} min-w-0 border-l border-[#2f6a96] bg-[#2f6a96] text-[24px] font-medium text-white sm:text-[28px]`}
          >
            {dayOfMonth(date)}
          </div>

          <Link
            href={`/?d=${addDays(date, 1)}`}
            aria-label={`Próximo dia, ${dayOfMonth(addDays(date, 1))}`}
            className={`${SEG} min-w-0 gap-0.5 border-l ${LINE} text-[18px] text-[#787774] hover:bg-[#f7f7f5] sm:text-[22px]`}
          >
            {dayOfMonth(addDays(date, 1))}
            <ChevronRight size={16} className="hidden sm:block" />
          </Link>

          <DayPicker
            date={date}
            today={today}
            className="min-w-0"
            tileClassName={`${SEG} w-full rounded-r-[11px] border-l ${LINE}`}
          />
        </div>

        {/* Atalho discreto: só aparece fora de hoje. A altura é sempre reservada (h-5)
            para a lista não "pular" quando ele aparece ou some. */}
        <div className="mb-1 mt-1 flex h-5 items-center justify-center">
          {date !== today && (
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded px-1.5 text-[11px] text-[#8aa6bb] transition-colors hover:text-[#2f6a96]"
            >
              <Undo2 size={11} aria-hidden />
              Voltar para hoje
            </Link>
          )}
        </div>
      </div>

      {!day ? (
        <div className="mt-6 rounded-lg bg-[#f7f7f5] p-6 text-center">
          <p className="text-sm text-[#787774]">Este dia ainda não tem lista.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {templateAvailable && (
              <CreateButton date={date} mode="template" primary>
                Usar o modelo
              </CreateButton>
            )}
            {previousDate && (
              <CreateButton date={date} mode="copy" primary={!templateAvailable}>
                Copiar o dia {dm(previousDate)}
              </CreateButton>
            )}
            <CreateButton date={date} mode="empty" primary={false}>
              Começar do zero
            </CreateButton>
          </div>
        </div>
      ) : (
        // key: ao trocar de dia, a lista interativa recomeça do zero (sem estado do dia anterior)
        <DayBoard
          key={day.id}
          day={day}
          initialPermanent={initialPermanent}
          // A faixa de progresso só aparece quando o cartão de resumo está oculto
          stripClassName={menuExpanded ? "min-[1280px]:hidden" : "lg:hidden"}
        />
      )}
    </article>
  );
}
