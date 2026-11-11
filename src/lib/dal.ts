import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

/** Usuário logado ou null. Memoizado durante uma renderização. */
export const getCurrentUser = cache(getSessionUser);

/**
 * Use em TODA página, Server Action e Route Handler que mexe em dados.
 * É a defesa real: o proxy.ts só faz um redirecionamento "otimista".
 */
export const verifySession = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});
