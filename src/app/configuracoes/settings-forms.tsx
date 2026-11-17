"use client";

import { useActionState, useState, useTransition } from "react";
import {
  changePasswordAction,
  signOutAllAction,
  signOutOthersAction,
  updateNameAction,
  type SettingsState,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-[#dcdad5] bg-white px-3 py-2 text-sm text-[#37352f] outline-none transition " +
  "placeholder:text-[#b4b2ad] focus:border-[#2f6a96] focus:ring-2 focus:ring-[#2f6a96]/20 max-md:text-base";
const buttonClass =
  "rounded-md border border-[#2f6a96] bg-[#16283d] px-4 py-2 text-sm text-[#dfe6f5] transition hover:bg-[#1d3652] disabled:cursor-wait disabled:opacity-60";
const ghostButtonClass =
  "rounded-md border border-[#dcdad5] bg-white px-4 py-2 text-sm text-[#37352f] transition hover:bg-[#f7f7f5] disabled:cursor-wait disabled:opacity-60";

function Message({ state }: { state: SettingsState }) {
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-sm">
      {state?.error && <span className="text-[#c4554d]">{state.error}</span>}
      {state?.ok && <span className="text-[#2f7d4f]">{state.ok}</span>}
    </p>
  );
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateNameAction, undefined);
  return (
    <form action={action} className="flex max-w-md flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1.5 text-sm text-[#787774]">
        Nome
        <input
          name="name"
          defaultValue={name}
          maxLength={100}
          autoComplete="name"
          required
          className={inputClass}
        />
      </label>
      <Message state={state} />
      <div>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Salvando..." : "Salvar nome"}
        </button>
      </div>
    </form>
  );
}

function PasswordField({
  name,
  label,
  autoComplete,
  show,
}: {
  name: string;
  label: string;
  autoComplete: string;
  show: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-[#787774]">
      {label}
      <input
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        maxLength={128}
        required
        className={inputClass}
      />
    </label>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="flex max-w-md flex-col gap-3" noValidate>
      <PasswordField name="current" label="Senha atual" autoComplete="current-password" show={show} />
      <PasswordField name="next" label="Nova senha (mínimo 12 caracteres)" autoComplete="new-password" show={show} />
      <PasswordField name="confirm" label="Repita a nova senha" autoComplete="new-password" show={show} />
      <label className="flex items-center gap-2 text-sm text-[#787774]">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Mostrar senhas
      </label>
      <Message state={state} />
      <div>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Alterando..." : "Alterar senha"}
        </button>
      </div>
    </form>
  );
}

export function DevicesPanel({ activeSessions }: { activeSessions: number }) {
  const [state, setState] = useState<SettingsState>();
  const [pending, start] = useTransition();
  const others = Math.max(0, activeSessions - 1);

  return (
    <div className="flex max-w-md flex-col gap-3">
      <p className="text-sm text-[#787774]">
        {activeSessions <= 1
          ? "Só este aparelho está conectado."
          : `Este aparelho e mais ${others} ${others === 1 ? "outro estão" : "outros estão"} conectados.`}
      </p>
      <Message state={state} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || others === 0}
          className={ghostButtonClass}
          onClick={() => start(async () => setState(await signOutOthersAction()))}
        >
          Sair dos outros aparelhos
        </button>
        <button
          type="button"
          disabled={pending}
          className={ghostButtonClass}
          onClick={() => {
            if (window.confirm("Sair de todos os aparelhos, inclusive este?")) {
              start(async () => {
                await signOutAllAction();
              });
            }
          }}
        >
          Sair de todos os aparelhos
        </button>
      </div>
    </div>
  );
}
