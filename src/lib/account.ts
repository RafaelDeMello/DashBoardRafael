import "server-only";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

// Dados da conta do usuário. REGRA: toda função recebe o userId da SESSÃO (nunca de um
// campo da tela), então ninguém consegue alterar a conta de outra pessoa.

export async function updateName(userId: string, name: string): Promise<void> {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

/** Quantos aparelhos têm uma sessão válida agora (inclui este). */
export async function countActiveSessions(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())));
  return row.total;
}

export type ChangePasswordResult = "ok" | "wrong_current" | "same_password";

/**
 * Troca a senha. Exige a senha ATUAL (quem pegou um aparelho já logado não consegue
 * trocar a senha sem saber a atual). Quem chama deve, em seguida, encerrar as sessões
 * antigas (veja changePasswordAction).
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return "wrong_current";

  if (!(await verifyPassword(user.passwordHash, currentPassword))) return "wrong_current";
  if (currentPassword === newPassword) return "same_password";

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, userId));
  return "ok";
}
