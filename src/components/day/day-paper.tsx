import Link from "next/link";
import { ChevronLeft, ChevronRight, Sun } from "lucide-react";
import { createDayAction } from "@/app/actions";
import { addDays, formatTitle } from "@/lib/date";
import type { DayData } from "@/lib/days";
import { DayBoard } from "./day-board";
import { DayMenu } from "./day-menu";

const dm = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

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
    <article className="min-w-0 flex-1 overflow-y-auto rounded-t-lg bg-white px-5 py-6 text-[#37352f] md:px-[30px]">
      <div className="mb-2.5 flex items-center justify-between text-xs text-[#9b9a97]">
        <span>Only-Tasks</span>
        <div className="flex items-center gap-1.5">
          <nav className="flex items-center gap-1.5" aria-label="Navegar entre dias">
            <Link
              href={`/?d=${addDays(date, -1)}`}
              aria-label="Dia anterior"
              className="rounded p-0.5 hover:bg-[#f1f1ef]"
            >
              <ChevronLeft size={16} />
            </Link>
            {date === today ? (
              <span className="text-[#37352f]">Hoje</span>
            ) : (
              <Link href="/" className="text-[#2f6a96] hover:underline">
                Ir para hoje
              </Link>
            )}
            <Link
              href={`/?d=${addDays(date, 1)}`}
              aria-label="Próximo dia"
              className="rounded p-0.5 hover:bg-[#f1f1ef]"
            >
              <ChevronRight size={16} />
            </Link>
          </nav>
          {day && <DayMenu key={date} date={date} />}
        </div>
      </div>

      <Sun size={28} className="text-[#2f6a96]" />
      <h1 className="mb-3 mt-1.5 text-[28px] font-medium leading-tight text-[#2f2f2c]">
        {formatTitle(date)}
      </h1>

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
          stripClassName={menuExpanded ? "min-[1536px]:hidden" : "lg:hidden"}
        />
      )}
    </article>
  );
}
