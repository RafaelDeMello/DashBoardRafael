import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { DayPaper } from "@/components/day/day-paper";
import { SummaryCard } from "@/components/day/summary-card";
import { addDays, isValidISODate, monthBounds, todayISO } from "@/lib/date";
import { verifySession } from "@/lib/dal";
import { getDay, getPreviousDayDate, getProgressRange, templateHasContent } from "@/lib/days";
import { streak } from "@/lib/progress";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await verifySession(); // sem sessão válida, redireciona para /login

  // Data da tela: ?d=AAAA-MM-DD (inválida ou ausente = hoje)
  const params = await searchParams;
  const raw = typeof params.d === "string" ? params.d : undefined;
  const today = todayISO();
  const date = raw && isValidISODate(raw) ? raw : today;

  const jar = await cookies();
  const expanded = jar.get("menu")?.value === "expanded";
  // "Alterações valem: Só hoje | Sempre" (preferência guardada pela própria lista)
  const initialPermanent = jar.get("scope")?.value === "permanent";

  // Uma consulta cobre o calendário do mês e a sequência (120 dias para trás)
  const [day, previousDate, progress, templateAvailable] = await Promise.all([
    getDay(user.id, date),
    getPreviousDayDate(user.id, date),
    getProgressRange(user.id, addDays(date, -120), monthBounds(date).end),
    templateHasContent(user.id),
  ]);

  const sections =
    day?.sections.map((s) => ({
      id: s.id,
      title: s.title,
      done: s.items.filter((i) => i.done).length,
      total: s.items.length,
    })) ?? [];
  const total = sections.reduce((n, s) => n + s.total, 0);
  const done = sections.reduce((n, s) => n + s.done, 0);

  return (
    <AppShell
      active="tasks"
      expanded={expanded}
      date={date}
      progress={progress}
      // Cartão de resumo: com o menu recolhido aparece a partir de 1024px; com o menu
      // expandido só a partir de 1280px (largura CSS, já descontados zoom e escala do
      // Windows). Quando está oculto, o progresso vira uma faixa dentro da folha.
      aside={
        <aside
          className={`hidden w-[204px] flex-none ${
            expanded ? "min-[1280px]:block" : "lg:block"
          }`}
        >
          {day && (
            <SummaryCard
              done={done}
              total={total}
              sections={sections}
              streakDays={streak(progress, date, today)}
            />
          )}
        </aside>
      }
    >
      <DayPaper
        date={date}
        today={today}
        day={day}
        previousDate={previousDate}
        templateAvailable={templateAvailable}
        menuExpanded={expanded}
        initialPermanent={initialPermanent}
      />
    </AppShell>
  );
}
