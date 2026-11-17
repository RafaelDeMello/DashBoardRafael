"use client";

import { useActionState, useState } from "react";
import { signUp } from "./actions";

const labelClass = "font-retro text-xl uppercase tracking-[0.2em] text-neon";
const inputClass =
  "w-full rounded-none border-2 border-steel bg-[#0b0d11] px-4 py-3 font-mono text-[0.95rem] text-white max-md:text-base " +
  "placeholder:text-white/30 outline-none transition " +
  "focus:border-neon focus:shadow-[4px_4px_0_rgba(25,230,255,0.45)]";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2">
        <span className={labelClass}>&gt; Nome</span>
        <input
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={state?.name}
          placeholder="Seu nome"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>&gt; E-mail</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state?.email}
          placeholder="voce@email.com"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>&gt; Senha (mín. 12)</span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            maxLength={128}
            placeholder="********"
            className={`${inputClass} pr-24`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-1.5 right-1.5 rounded-none border-2 border-steel px-3 font-retro text-lg uppercase tracking-widest text-white transition-colors hover:border-neon hover:text-neon"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </label>

      <p role="alert" aria-live="polite" className="min-h-5 font-retro text-lg text-pink">
        {state?.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-none border-2 border-[#2f6a96] bg-[#16283d] px-6 py-4 font-pixel text-sm uppercase tracking-wide text-[#dfe6f5] shadow-[4px_4px_0_#08121f] transition hover:border-[#4a8fc4] hover:bg-[#1d3652] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#08121f] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Criando..." : "▶ Criar conta"}
      </button>
    </form>
  );
}
