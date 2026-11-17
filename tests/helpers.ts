import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { assertTestDatabase } from "./test-db-url.mts";
import { users } from "@/db/schema";

// Segunda trava: mesmo que alguém mude a configuração, nada roda fora do banco de teste.
assertTestDatabase(process.env.DATABASE_URL);

const created: string[] = [];

/** Cria um usuário só para o teste (e-mail único). O hash é falso: aqui não se faz login. */
export async function createTestUser(label = "u"): Promise<string> {
  const [row] = await db
    .insert(users)
    .values({
      email: `${label}-${randomUUID()}@teste.local`,
      name: label,
      passwordHash: "hash-falso-de-teste",
    })
    .returning({ id: users.id });
  created.push(row.id);
  return row.id;
}

/** Apaga os usuários criados (listas, seções e itens saem junto, por cascade). */
export async function cleanupTestUsers() {
  if (created.length === 0) return;
  await db.delete(users).where(inArray(users.id, created));
  created.length = 0;
}

export async function userExists(id: string) {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  return !!row;
}
