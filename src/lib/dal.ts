import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

/** Usuário logado ou null. Memoizado durante uma renderização. */
export const getCurrentUser = cache(getSessionUser);

/**
 * Use em TODA página, Server Action e Route Handler que mexe em dados do app.
 * É a defesa real: o proxy.ts só faz um redirecionamento "otimista".
 *
 * Só passa quem está logado, com acesso LIBERADO e que não é admin:
 * - sem sessão -> login
 * - conta aguardando liberação ou bloqueada -> tela de espera
 * - admin -> painel de acessos (o admin não usa as listas)
 */
export const verifySession = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.status !== "approved") redirect("/aguardando");
  return user;
});

/** Só exige estar logado (qualquer status). Para a tela "aguardando liberação". */
export const verifyAccount = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

/** Painel de administrador: só admin com acesso liberado. */
export const verifyAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  if (user.status !== "approved") redirect("/aguardando");
  return user;
});
