"use client";

import { useActionState, useState, useTransition } from "react";
import {
  changePasswordAction,
  signOutAllAction,
  signOutOthersAction,
  updateNameAction,
  type SettingsState,
} from "./actions";
import { logout } from "@/app/login/actions";
import { btnGhost, btnPrimary, winInput, winLabel } from "@/components/win";

const inputClass = winInput;
const buttonClass = btnPrimary;
const ghostButtonClass = btnGhost;

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
    <form action={action} noValidate>
      <div className="flex flex-wrap items-end gap-3">
        <label className={`flex min-w-0 flex-1 basis-56 flex-col gap-1 ${winLabel}`}>
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
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Salvando..." : "Salvar nome"}
        </button>
      </div>
      <Message state={state} />
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
    <label className={`flex flex-col gap-1 ${winLabel}`}>
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
    <form action={action} className="flex flex-col gap-3" noValidate>
      <div className="grid gap-3 md:grid-cols-3">
        <PasswordField name="current" label="Senha atual" autoComplete="current-password" show={show} />
        <PasswordField name="next" label="Nova (mín. 12)" autoComplete="new-password" show={show} />
        <PasswordField name="confirm" label="Repita a nova" autoComplete="new-password" show={show} />
      </div>
      <Message state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className={`flex items-center gap-2 ${winLabel}`}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          Mostrar senhas
        </label>
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
    <div className="flex flex-col gap-3">
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
        {/* No celular não há menu lateral com o botão Sair */}
        <form action={logout} className="md:hidden">
          <button type="submit" className={ghostButtonClass}>
            Sair deste aparelho
          </button>
        </form>
      </div>
    </div>
  );
}
