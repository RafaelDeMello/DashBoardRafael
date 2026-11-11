import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

import { SESSION_COOKIE } from "./session-cookie";

const isProd = process.env.NODE_ENV === "production";

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const RENEW_BELOW_MS = 15 * 24 * 60 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url"); // 256 bits aleatórios
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript da página não consegue ler
    secure: isProd, // só trafega por HTTPS em produção
    sameSite: "lax", // não vai em requisições vindas de outros sites
    path: "/",
    expires: expiresAt,
  });
}

export type SessionUser = { id: string; email: string; name: string | null };

/** Lê o cookie e devolve o usuário logado, ou null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha256(token)))
    .limit(1);

  if (!row) return null;

  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  // Sessão deslizante: quem usa o app não é deslogado do nada.
  // (A renovação do cookie só é possível em Server Action/Route Handler;
  // aqui só estendemos o prazo no banco. O cookie é renovado no próximo login.)
  if (row.expiresAt.getTime() - Date.now() < RENEW_BELOW_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + TTL_MS) })
      .where(eq(sessions.id, row.sessionId));
  }

  return { id: row.id, email: row.email, name: row.name };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}
