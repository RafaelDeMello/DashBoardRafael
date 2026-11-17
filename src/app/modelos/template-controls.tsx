"use client";

import { useActionState, useState } from "react";
import {
  createTemplateAction,
  deleteTemplateAction,
  renameTemplate,
  useTemplateOnDayAction,
} from "@/app/actions";

const inputClass =
  "w-full rounded-md border border-[#dcdad5] bg-white px-2.5 py-1.5 text-sm text-[#37352f] outline-none transition " +
  "placeholder:text-[#b4b2ad] focus:border-[#2f6a96] focus:ring-2 focus:ring-[#2f6a96]/20 max-md:text-base";
const primary =
  "rounded-md bg-[#2f6a96] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#285a80] disabled:opacity-60";
const ghost =
  "rounded-md border border-[#dcdbd8] bg-white px-3 py-1.5 text-xs text-[#37352f] transition-colors hover:bg-[#f1f1ef] disabled:opacity-60";

/** "+ Novo modelo": pede o nome e cria um modelo vazio. */
export function NewTemplateForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createTemplateAction, undefined);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={ghost}>
        + Novo modelo
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <input
        name="name"
        autoFocus
        required
        maxLength={100}
        placeholder="Nome do modelo"
        aria-label="Nome do modelo"
        className={inputClass}
      />
      {state?.error && <p role="alert" className="text-xs text-[#c4554d]">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primary}>
          Criar
        </button>
        <button type="button" onClick={() => setOpen(false)} className={ghost}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Nome do modelo (clique para renomear) e ações: duplicar, usar em um dia e apagar. */
export function TemplateHeader({
  id,
  name,
  usedDays,
  today,
}: {
  id: string;
  name: string;
  usedDays: number;
  today: string;
}) {
  const [renaming, setRenaming] = useState(false);
  const [picking, setPicking] = useState(false);
  const [useState_, useAction, usePending] = useActionState(useTemplateOnDayAction, undefined);
  const [dupState, dupAction, dupPending] = useActionState(createTemplateAction, undefined);

  const saveName = (value: string) => {
    setRenaming(false);
    const next = value.trim();
    if (next && next !== name) void renameTemplate({ templateId: id, name: next });
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {renaming ? (
            <input
              autoFocus
              defaultValue={name}
              maxLength={100}
              aria-label="Nome do modelo"
              onBlur={(e) => saveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName(e.currentTarget.value);
                if (e.key === "Escape") setRenaming(false);
              }}
              className="w-full rounded border border-[#2f6a96] px-1.5 text-[22px] font-medium outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              title="Renomear modelo"
              className="max-w-full truncate text-left text-[22px] font-medium leading-tight text-[#2f2f2c]"
            >
              {name}
            </button>
          )}
          <p className="mt-0.5 text-xs text-[#9b9a97]">
            {usedDays === 0 ? "Ainda não foi usado" : `Usado em ${usedDays} ${usedDays === 1 ? "dia" : "dias"}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={dupAction}>
            <input type="hidden" name="name" value={`Cópia de ${name}`.slice(0, 100)} />
            <input type="hidden" name="copyFrom" value={id} />
            <button type="submit" disabled={dupPending} className={ghost}>
              Duplicar
            </button>
          </form>
          <button type="button" onClick={() => setPicking((v) => !v)} className={primary} aria-expanded={picking}>
            Usar em um dia
          </button>
        </div>
      </div>

      {picking && (
        <form
          action={useAction}
          className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#f7f7f5] p-3"
        >
          <input type="hidden" name="templateId" value={id} />
          <label className="flex items-center gap-2 text-xs text-[#787774]">
            Data
            <input type="date" name="date" defaultValue={today} required className={`${inputClass} !w-auto`} />
          </label>
          <button type="submit" disabled={usePending} className={primary}>
            Criar o dia
          </button>
          {useState_?.error && (
            <p role="alert" className="w-full text-xs text-[#c4554d]">
              {useState_.error}
            </p>
          )}
        </form>
      )}
      {dupState?.error && (
        <p role="alert" className="mt-2 text-xs text-[#c4554d]">
          {dupState.error}
        </p>
      )}
    </div>
  );
}

export function DeleteTemplateForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteTemplateAction}
      onSubmit={(e) => {
        if (!window.confirm(`Apagar o modelo “${name}”? Os dias já criados continuam como estão.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="templateId" value={id} />
      <button type="submit" className="text-xs text-[#b8b7b4] transition-colors hover:text-[#c0392b]">
        Apagar este modelo
      </button>
    </form>
  );
}
