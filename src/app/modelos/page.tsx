import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DayBoard } from "@/components/day/day-board";
import { Win } from "@/components/win";
import { verifySession } from "@/lib/dal";
import { getTemplate, listTemplates } from "@/lib/days";
import { loadShell } from "@/lib/shell";
import { DeleteTemplateForm, NewTemplateForm, TemplateActions, TemplateTitle } from "./template-controls";

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
  // No celular são duas telas: a lista (sem ?m) e o editor (com ?m). No computador aparecem juntas.
  const showEditorOnPhone = !!wanted || templates.length === 0;
  const data = selected ? await getTemplate(user.id, selected.id) : null;

  return (
    <AppShell active="modelos" expanded={shell.expanded} date={shell.today} progress={shell.progress}>
      <article className="min-w-0 flex-1 overflow-y-auto bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-[#37352f] md:px-6">
        <div className="mb-4 text-xs text-[#9b9a97]">Only-Tasks</div>
        <div className="flex flex-col gap-5 pb-2 pr-[3px] lg:flex-row lg:items-start">
          <Win
            title="Modelos"
            squares={false}
            className={`flex-none lg:w-[230px] ${wanted ? "max-lg:hidden" : ""}`}
          >
            <div className="p-2">
              <nav aria-label="Modelos" className="mb-3 flex flex-col gap-1">
                {templates.map((t) => (
                  <Link
                    key={t.id}
                    href={`/modelos?m=${t.id}`}
                    aria-current={t.id === selected?.id ? "page" : undefined}
                    className={`border-l-[3px] px-2.5 py-2 transition-colors ${
                      t.id === selected?.id
                        ? "border-[#19e6ff] bg-[#eef3f8]"
                        : "border-transparent hover:bg-[#f7f7f5]"
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
              <div className="px-1 pb-1">
                <NewTemplateForm />
              </div>
            </div>
          </Win>

          <div className={`min-w-0 flex-1 ${showEditorOnPhone ? "" : "max-lg:hidden"}`}>
            {wanted && (
              <Link href="/modelos" className="mb-3 inline-block text-xs text-[#787774] hover:text-[#2f6a96] lg:hidden">
                ‹ Todos os modelos
              </Link>
            )}
            {selected && data ? (
              <Win title={<TemplateTitle key={`titulo-${selected.id}`} id={selected.id} name={selected.name} />}>
                <div className="p-4">
                  <TemplateActions
                    key={`acoes-${selected.id}`}
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
                  <div className="mt-6 border-t border-[#ededeb] pt-3">
                    <DeleteTemplateForm id={selected.id} name={selected.name} />
                  </div>
                </div>
              </Win>
            ) : (
              <Win title="Crie seu primeiro modelo" squares={false}>
                <div className="p-4 text-sm text-[#787774]">
                  Um modelo é uma lista pronta para repetir em vários dias. Use “Novo modelo” ou, em
                  qualquer dia, o menu “⋯” → “Salvar este dia como modelo”.
                </div>
              </Win>
            )}
          </div>
        </div>
      </article>
    </AppShell>
  );
}
