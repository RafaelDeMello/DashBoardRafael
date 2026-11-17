"use client";

import { useActionState, useState } from "react";
import {
  createTemplateAction,
  deleteTemplateAction,
  renameTemplate,
  useTemplateOnDayAction,
} from "@/app/actions";
import { btnGhost, btnPrimary, winInput } from "@/components/win";

/** "+ Novo modelo": pede o nome e cria um modelo vazio. */
export function NewTemplateForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createTemplateAction, undefined);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btnGhost}>
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
        className={winInput}
      />
      {state?.error && <p role="alert" className="text-xs text-[#c4554d]">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          Criar
        </button>
        <button type="button" onClick={() => setOpen(false)} className={btnGhost}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Nome do modelo, na barra de título da janela (clique para renomear). */
export function TemplateTitle({ id, name }: { id: string; name: string }) {
  const [renaming, setRenaming] = useState(false);

  const save = (value: string) => {
    setRenaming(false);
    const next = value.trim();
    if (next && next !== name) void renameTemplate({ templateId: id, name: next });
  };

  if (renaming) {
    return (
      <input
        autoFocus
        defaultValue={name}
        maxLength={100}
        aria-label="Nome do modelo"
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save(e.currentTarget.value);
          if (e.key === "Escape") setRenaming(false);
        }}
        className="w-48 max-w-full border border-[#2f6a96] bg-white px-1 font-retro text-[17px] uppercase tracking-[0.12em] text-[#1a1a18] outline-none"
      />
    );
  }
  return (
    <button type="button" onClick={() => setRenaming(true)} title="Renomear modelo" className="max-w-full truncate uppercase">
      {name}
    </button>
  );
}

/** Quantos dias usaram o modelo + ações: duplicar e usar em um dia. */
export function TemplateActions({
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
  const [picking, setPicking] = useState(false);
  const [useState_, useAction, usePending] = useActionState(useTemplateOnDayAction, undefined);
  const [dupState, dupAction, dupPending] = useActionState(createTemplateAction, undefined);

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#9b9a97]">
          {usedDays === 0 ? "Ainda não foi usado" : `Usado em ${usedDays} ${usedDays === 1 ? "dia" : "dias"}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <form action={dupAction}>
            <input type="hidden" name="name" value={`Cópia de ${name}`.slice(0, 100)} />
            <input type="hidden" name="copyFrom" value={id} />
            <button type="submit" disabled={dupPending} className={btnGhost}>
              Duplicar
            </button>
          </form>
          <button type="button" onClick={() => setPicking((v) => !v)} className={btnPrimary} aria-expanded={picking}>
            Usar em um dia
          </button>
        </div>
      </div>

      {picking && (
        <form action={useAction} className="mt-3 flex flex-wrap items-center gap-2 border border-[#cfd8e3] bg-[#f4f7fa] p-3">
          <input type="hidden" name="templateId" value={id} />
          <label className="flex items-center gap-2 font-retro text-[15px] uppercase tracking-[0.12em] text-[#787774]">
            Data
            <input type="date" name="date" defaultValue={today} required className={`${winInput} !w-auto`} />
          </label>
          <button type="submit" disabled={usePending} className={btnPrimary}>
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
