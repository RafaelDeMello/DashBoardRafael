import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

// Gestão de acessos (só o painel de administrador usa). QUEM chama já conferiu verifyAdmin().
// REGRA: nunca altera contas de administrador, só contas comuns (role = 'user'),
// para ninguém conseguir bloquear o admin por esta via.

export type AccountStatus = "pending" | "approved" | "blocked";
export type Account = {
  id: string;
  name: string | null;
  email: string;
  status: AccountStatus;
  createdAt: Date;
};

/** Contas comuns: as aguardando liberação primeiro, depois as mais recentes. */
export async function listAccounts(): Promise<Account[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "user"))
    .orderBy(
      sql`case ${users.status} when 'pending' then 0 when 'blocked' then 2 else 1 end`,
      desc(users.createdAt),
      asc(users.id),
    );
}

/** Libera ou bloqueia uma conta comum. Bloquear também derruba as sessões dela. */
export async function setAccountStatus(
  userId: string,
  status: "approved" | "blocked",
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(users)
      .set({ status })
      .where(and(eq(users.id, userId), eq(users.role, "user")))
      .returning({ id: users.id });
    if (!row) return false;
    if (status === "blocked") await tx.delete(sessions).where(eq(sessions.userId, userId));
    return true;
  });
}
