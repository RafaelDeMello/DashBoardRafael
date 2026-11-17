"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { changePassword, updateName } from "@/lib/account";
import { verifySession } from "@/lib/dal";
import { clearFailures, isBlocked, registerFailure } from "@/lib/rate-limit";
import { createSession, destroyAllSessions, destroyOtherSessions } from "@/lib/session";

// Toda ação parte de verifySession(): o usuário vem SEMPRE da sessão, nunca de um campo
// enviado pela tela. Assim ninguém consegue alterar a conta de outra pessoa.

export type SettingsState = { ok?: string; error?: string } | undefined;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_WRONG_CURRENT = 5;

const name = z
  .string()
  .trim()
  .min(1, "Digite um nome.")
  .max(100, "O nome pode ter no máximo 100 caracteres.")
  .regex(/^[^\p{C}]*$/u, "O nome tem caracteres inválidos.");

export async function updateNameAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await verifySession();

  const parsed = name.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await updateName(user.id, parsed.data);
  revalidatePath("/configuracoes");
  return { ok: "Nome atualizado." };
}

export async function changePasswordAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await verifySession();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current) return { error: "Digite a senha atual." };
  if (next.length < 12) return { error: "A nova senha precisa ter pelo menos 12 caracteres." };
  if (next.length > 128 || current.length > 128) {
    return { error: "A senha pode ter no máximo 128 caracteres." };
  }
  if (next !== confirm) return { error: "A confirmação não é igual à nova senha." };

  // Limite de tentativas ERRADAS da senha atual (quem pegou um aparelho já logado não
  // pode ficar adivinhando a senha por aqui)
  const key = `pwd:${user.id}`;
  if (isBlocked(key, MAX_WRONG_CURRENT)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  }

  const result = await changePassword(user.id, current, next);
  if (result === "wrong_current") {
    registerFailure(key, WINDOW_MS);
    return { error: "Senha atual incorreta." };
  }
  if (result === "same_password") return { error: "A nova senha precisa ser diferente da atual." };

  clearFailures(key);
  // Quem sabia a senha antiga (ou tinha uma sessão roubada) perde o acesso: encerra TODAS as
  // sessões e dá a este aparelho uma sessão nova, com token novo.
  await destroyAllSessions(user.id);
  await createSession(user.id);

  revalidatePath("/configuracoes");
  return { ok: "Senha alterada. Os outros aparelhos foram desconectados." };
}

export async function signOutOthersAction(): Promise<SettingsState> {
  const user = await verifySession();
  await destroyOtherSessions(user.id);
  revalidatePath("/configuracoes");
  return { ok: "Os outros aparelhos foram desconectados." };
}

export async function signOutAllAction() {
  const user = await verifySession();
  await destroyAllSessions(user.id);
  redirect("/login");
}
