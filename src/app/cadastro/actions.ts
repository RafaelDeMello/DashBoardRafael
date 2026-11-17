"use server";

import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getClientIp } from "@/lib/client-ip";
import { hashPassword } from "@/lib/password";
import { isBlocked, registerFailure } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { MAX_PENDING, SIGNUP_MAX_PER_IP, SIGNUP_WINDOW_MS } from "@/lib/signup-config";

export type SignupState = { error?: string; name?: string; email?: string } | undefined;

// Cadastro aberto, mas a conta nasce "aguardando liberação" (status pending):
// sem a aprovação do administrador, ninguém acessa nada do app.

const input = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Digite seu nome.")
    .max(100, "O nome pode ter no máximo 100 caracteres.")
    .regex(/^[^\p{C}]*$/u, "O nome tem caracteres inválidos."),
  email: z.string().trim().toLowerCase().max(254, "E-mail inválido.").pipe(z.email("E-mail inválido.")),
  password: z
    .string()
    .min(12, "A senha precisa ter pelo menos 12 caracteres.")
    .max(128, "A senha pode ter no máximo 128 caracteres."),
});

export async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const rawName = String(formData.get("name") ?? "");
  const rawEmail = String(formData.get("email") ?? "");
  const keep = { name: rawName, email: rawEmail };

  const ipKey = `signup:${await getClientIp()}`;
  if (isBlocked(ipKey, SIGNUP_MAX_PER_IP)) {
    return { error: "Muitas tentativas. Aguarde um pouco e tente de novo.", ...keep };
  }
  registerFailure(ipKey, SIGNUP_WINDOW_MS);

  const parsed = input.safeParse({
    name: rawName,
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, ...keep };
  const { name, email, password } = parsed.data;

  const [pending] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.status, "pending"));
  if (pending.total >= MAX_PENDING) {
    return { error: "Cadastros indisponíveis no momento. Tente mais tarde.", ...keep };
  }

  // O hash é calculado antes de olhar se o e-mail existe: o tempo de resposta é o mesmo.
  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ email, name, passwordHash }) // role "user" e status "pending" são o padrão do banco
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  // Sem verificação de e-mail não dá para esconder que o e-mail já tem conta
  if (!created) return { error: "Este e-mail já tem conta. Tente entrar.", ...keep };

  await createSession(created.id);
  redirect("/"); // a página inicial leva a conta aguardando para a tela de espera
}
