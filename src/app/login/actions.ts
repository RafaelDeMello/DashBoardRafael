"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { dummyHash, verifyPassword } from "@/lib/password";
import { clearFailures, isBlocked, registerFailure } from "@/lib/rate-limit";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error?: string; email?: string } | undefined;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

// Mesma mensagem para "e-mail não existe" e "senha errada":
// assim ninguém descobre quais e-mails têm conta.
const GENERIC_ERROR = "E-mail ou senha incorretos.";

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128), // teto evita gastar CPU com senha gigante
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");

  const parsed = credentials.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC_ERROR, email: rawEmail };
  const { email, password } = parsed.data;

  // x-forwarded-for só é confiável atrás de um proxy reverso nosso (na VPS, o Nginx/Caddy).
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  const emailKey = `email:${email}`;
  const ipKey = `ip:${ip}`;

  if (isBlocked(emailKey, MAX_PER_EMAIL) || isBlocked(ipKey, MAX_PER_IP)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo.", email };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Sempre roda uma verificação de hash, mesmo sem usuário (tempo de resposta igual).
  const valid = await verifyPassword(user?.passwordHash ?? (await dummyHash()), password);

  if (!user || !valid) {
    registerFailure(emailKey, WINDOW_MS);
    registerFailure(ipKey, WINDOW_MS);
    return { error: GENERIC_ERROR, email };
  }

  clearFailures(emailKey);
  await createSession(user.id); // sessão nova a cada login
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
