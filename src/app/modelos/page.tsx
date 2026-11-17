import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DayBoard } from "@/components/day/day-board";
import { verifySession } from "@/lib/dal";
import { getTemplate, listTemplates } from "@/lib/days";
import { loadShell } from "@/lib/shell";
import { DeleteTemplateForm, NewTemplateForm, TemplateHeader } from "./template-controls";

export const metadata = { title: "Modelos · Only-Tasks" };

export default async function ModelosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await verifySession();
  const { m } = await searchParams;
  const [shell, templates] = await Promise.all([loadShell(user.id), listTemplates(user.id)]);

  // Modelo aberto: ?m=<id> (se não for um modelo deste usuário, abre o primeiro)
  const wanted = typeof m === "string" ? templates.find((t) => t.id === m) : undefined;
  const selected = wanted ?? templates[0];
  const data = selected ? await getTemplate(user.id, selected.id) : null;

  return (
    <AppShell active="modelos" expanded={shell.expanded} date={shell.today} progress={shell.progress}>
      <article className="flex min-w-0 flex-1 flex-col overflow-y-auto rounded-t-lg bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[#37352f] md:flex-row md:overflow-hidden">
        <aside className="flex-none border-b border-[#ebeae6] px-5 pb-4 pt-6 md:w-[230px] md:overflow-y-auto md:border-b-0 md:border-r md:px-4">
          <div className="mb-3 text-xs text-[#9b9a97]">Only-Tasks</div>
          <h1 className="mb-3 font-retro text-xl uppercase tracking-[0.18em] text-[#2f6a96]">Meus modelos</h1>

          <nav aria-label="Modelos" className="mb-3 flex flex-col gap-1">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/modelos?m=${t.id}`}
                aria-current={t.id === selected?.id ? "page" : undefined}
                className={`rounded-md px-2.5 py-2 transition-colors ${
                  t.id === selected?.id ? "bg-[#eef3f8]" : "hover:bg-[#f7f7f5]"
                }`}
              >
                <div className="truncate text-sm font-medium text-[#2f2f2c]">{t.name}</div>
                <div className="text-xs text-[#9b9a97]">
                  {t.sectionCount} {t.sectionCount === 1 ? "seção" : "seções"} · {t.itemCount}{" "}
                  {t.itemCount === 1 ? "item" : "itens"}
                </div>
              </Link>
            ))}
          </nav>
          <NewTemplateForm />
        </aside>

        <section className="min-w-0 flex-1 px-5 pb-6 pt-6 md:overflow-y-auto md:px-[30px]">
          {selected && data ? (
            <>
              <TemplateHeader
                key={`cabecalho-${selected.id}`}
                id={selected.id}
                name={selected.name}
                usedDays={selected.usedDays}
                today={shell.today}
              />
              <DayBoard
                key={`lista-${data.id}`}
                template
                day={{ id: data.id, date: "", sections: data.sections }}
                initialPermanent={false}
                stripClassName="hidden"
              />
              <div className="mt-8 border-t border-[#ededeb] pt-3">
                <DeleteTemplateForm id={selected.id} name={selected.name} />
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-[#f7f7f5] p-6 text-sm text-[#787774]">
              <p className="font-medium text-[#2f2f2c]">Crie seu primeiro modelo</p>
              <p className="mt-1">
                Um modelo é uma lista pronta para repetir em vários dias. Use “Novo modelo” ao lado ou, em
                qualquer dia, o menu “⋯” → “Salvar este dia como modelo”.
              </p>
            </div>
          )}
        </section>
      </article>
    </AppShell>
  );
}
