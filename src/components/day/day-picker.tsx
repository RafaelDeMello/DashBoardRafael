"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

/** Quadrado do calendário: abre um seletor de data, com atalho para voltar a hoje. */
export function DayPicker({
  date,
  today,
  tileClassName,
}: {
  date: string;
  today: string;
  tileClassName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
    router.push(target === today ? "/" : `/?d=${target}`);
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Escolher uma data"
        title="Escolher uma data"
        onClick={() => setOpen((v) => !v)}
        className={`${tileClassName} text-[#787774] hover:bg-[#f7f7f5]`}
      >
        <CalendarDays size={26} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Escolher uma data"
          className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-[#e3e2df] bg-white p-3 text-sm text-[#37352f] shadow-lg"
        >
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = (new FormData(e.currentTarget).get("date") as string) || "";
              if (value) go(value);
            }}
          >
            <label htmlFor="ir-para-data" className="text-xs text-[#787774]">
              Ir para a data
            </label>
            <div className="flex gap-2">
              <input
                id="ir-para-data"
                name="date"
                type="date"
                required
                defaultValue={date}
                autoFocus
                className="min-w-0 flex-1 rounded border border-[#dcdbd8] px-2 py-1 text-sm outline-none focus:border-[#2f6a96]"
              />
              <button
                type="submit"
                className="rounded-md bg-[#2f6a96] px-3 py-1 text-xs text-white hover:bg-[#285a80]"
              >
                Ir
              </button>
            </div>
          </form>
          <button
            type="button"
            disabled={date === today}
            onClick={() => go(today)}
            className="mt-2 w-full rounded px-2 py-1.5 text-left text-[#2f6a96] hover:bg-[#eef4f9] disabled:cursor-default disabled:text-[#b8b7b4] disabled:hover:bg-transparent"
          >
            Voltar para hoje
          </button>
        </div>
      )}
    </div>
  );
}
