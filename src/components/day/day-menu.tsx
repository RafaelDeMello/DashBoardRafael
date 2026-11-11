"use client";

import { useActionState } from "react";
import { Ellipsis } from "lucide-react";
import { copyDayAction, deleteDayAction, saveAsTemplateAction } from "@/app/actions";

/** Menu "..." do dia: copiar para outra data, salvar como modelo e apagar. */
export function DayMenu({ date }: { date: string }) {
  const [copyState, copyAction, copying] = useActionState(copyDayAction, undefined);

  return (
    <details className="relative">
      <summary
        aria-label="Mais ações do dia"
        title="Mais ações do dia"
        className="cursor-pointer list-none rounded p-0.5 hover:bg-[#f1f1ef] [&::-webkit-details-marker]:hidden"
      >
        <Ellipsis size={16} />
      </summary>

      <div className="absolute right-0 z-20 mt-1 w-72 rounded-lg border border-[#e3e2df] bg-white p-3 text-sm text-[#37352f] shadow-lg">
        <form action={copyAction} className="flex flex-col gap-1.5">
          <input type="hidden" name="from" value={date} />
          <label htmlFor="copiar-para" className="text-xs text-[#787774]">
            Copiar este dia para
          </label>
          <div className="flex gap-2">
            <input
              id="copiar-para"
              type="date"
              name="to"
              required
              className="min-w-0 flex-1 rounded border border-[#dcdbd8] px-2 py-1 text-sm outline-none focus:border-[#2f6a96]"
            />
            <button
              type="submit"
              disabled={copying}
              className="rounded-md bg-[#2f6a96] px-3 py-1 text-xs text-white hover:bg-[#285a80] disabled:opacity-60"
            >
              Copiar
            </button>
          </div>
          <p role="alert" className="min-h-4 text-xs text-[#c0392b]">
            {copyState?.error}
          </p>
        </form>

        <div className="my-2 h-px bg-[#ededeb]" />

        <form action={saveAsTemplateAction}>
          <input type="hidden" name="date" value={date} />
          <button type="submit" className="w-full rounded px-2 py-1.5 text-left hover:bg-[#f1f1ef]">
            Salvar este dia como modelo
            <span className="block text-xs text-[#9b9a97]">
              Substitui o modelo usado em “Usar o modelo”.
            </span>
          </button>
        </form>

        <div className="my-2 h-px bg-[#ededeb]" />

        <details>
          <summary className="cursor-pointer list-none rounded px-2 py-1.5 text-[#c0392b] hover:bg-[#fdf1ef] [&::-webkit-details-marker]:hidden">
            Apagar este dia
          </summary>
          <form action={deleteDayAction} className="mt-1 flex flex-col gap-2 px-2 pb-1">
            <input type="hidden" name="date" value={date} />
            <span className="text-xs text-[#787774]">
              Apaga a lista inteira deste dia. Não dá para desfazer.
            </span>
            <button
              type="submit"
              className="self-start rounded border border-[#e0b4ae] px-3 py-1 text-xs text-[#c0392b] hover:bg-[#fdf1ef]"
            >
              Sim, apagar
            </button>
          </form>
        </details>
      </div>
    </details>
  );
}
