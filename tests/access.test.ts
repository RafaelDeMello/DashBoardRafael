import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// CADASTRO ABERTO + LIBERAÇÃO PELO ADMINISTRADOR, ponta a ponta.
// Código real (ações, argon2, sessão, DAL, banco de teste). Só cookies/redirect/cache são simulados.

const h = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(public url: string) {
      super(`REDIRECT:${url}`);
    }
  }
  return {
    RedirectSignal,
    jar: new Map<string, { value: string; options: Record<string, unknown> }>(),
    ip: "198.51.100.1",
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const c = h.jar.get(name);
      return c ? { name, value: c.value } : undefined;
    },
    set: (name: string, value: string, options: Record<string, unknown> = {}) => {
      h.jar.set(name, { value, options });
    },
    delete: (name: string) => {
      h.jar.delete(name);
    },
  }),
  headers: async () => new Headers({ "x-forwarded-for": h.ip }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new h.RedirectSignal(url);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import * as adminActions from "@/app/admin/actions";
import { setAccountStatusAction } from "@/app/admin/actions";
import { createDayAction } from "@/app/actions";
import { signUp } from "@/app/cadastro/actions";
import { updateNameAction } from "@/app/configuracoes/actions";
import { login } from "@/app/login/actions";
import { verifyAccount, verifyAdmin, verifySession } from "@/lib/dal";
import { getDay } from "@/lib/days";
import { listAccounts } from "@/lib/admin";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { createSession, getSessionUser } from "@/lib/session";
import { MAX_PENDING, SIGNUP_MAX_PER_IP } from "@/lib/signup-config";
import { cleanupTestUsers, createLoginUser, createTestUser } from "./helpers";

const PASSWORD = "uma-senha-longa-e-correta";
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

let ipCounter = 10;
beforeEach(() => {
  h.jar.clear();
  h.ip = `198.51.100.${ipCounter++}`; // IP novo por teste: o limite por IP não interfere
});
afterAll(async () => {
  await db.delete(users).where(like(users.email, "signup-%@teste.local"));
  await cleanupTestUsers();
});

const loginAs = async (userId: string) => createSession(userId);
const redirectOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
  } catch (e) {
    if (e instanceof h.RedirectSignal) return e.url;
    throw e;
  }
  return null;
};
const statusOf = async (id: string) =>
  (await db.select({ s: users.status }).from(users).where(eq(users.id, id)))[0].s;
const byEmail = async (email: string) =>
  (await db.select().from(users).where(eq(users.email, email)))[0];
const newEmail = () => `signup-${randomUUID()}@teste.local`;
const signup = (fields: Partial<Record<"name" | "email" | "password", string>> = {}) =>
  signUp(undefined, form({ name: "Maria", email: newEmail(), password: PASSWORD, ...fields }));

describe("cadastro", () => {
  it("cria a conta como AGUARDANDO, com senha em hash, e já abre uma sessão", async () => {
    const email = newEmail();
    expect(await redirectOf(() => signup({ email, name: "  Maria  " }))).toBe("/");

    const u = await byEmail(email);
    expect(u).toMatchObject({ name: "Maria", role: "user", status: "pending" });
    expect(u.passwordHash).not.toContain(PASSWORD);
    expect(await verifyPassword(u.passwordHash, PASSWORD)).toBe(true);
    expect((await getSessionUser())?.id).toBe(u.id);
    const c = h.jar.get(SESSION_COOKIE)!;
    expect(c.options).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  it("normaliza o e-mail (espaços e maiúsculas)", async () => {
    const email = newEmail();
    await redirectOf(() => signup({ email: `  ${email.toUpperCase()}  ` }));
    expect((await byEmail(email))?.email).toBe(email);
  });

  it("não dá acesso: a conta nova cai na tela de espera", async () => {
    await redirectOf(() => signup());
    expect(await redirectOf(() => verifySession())).toBe("/aguardando");
  });

  it("não permite escolher papel nem status pelo formulário", async () => {
    const email = newEmail();
    await redirectOf(() => signup({ email, role: "admin", status: "approved" } as never));
    const f = form({ name: "X", email: newEmail(), password: PASSWORD, role: "admin", status: "approved" });
    await redirectOf(() => signUp(undefined, f));
    const u = await byEmail(email);
    expect(u).toMatchObject({ role: "user", status: "pending" });
    const [row] = await db.select().from(users).where(eq(users.email, f.get("email") as string));
    expect(row).toMatchObject({ role: "user", status: "pending" });
  });

  it("recusa entradas inválidas e não cria nada", async () => {
    const bad = [
      { name: "" },
      { name: "a".repeat(101) },
      { name: "oi\u0000x" },
      { email: "nao-e-email" },
      { password: "curta" },
      { password: "x".repeat(129) },
    ];
    for (const b of bad) {
      const email = newEmail();
      const r = await signUp(undefined, form({ name: "Maria", email, password: PASSWORD, ...b }));
      expect(r?.error, JSON.stringify(b)).toBeTruthy();
      if (!("email" in b)) expect(await byEmail(email)).toBeUndefined();
    }
    expect(h.jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("e-mail que já tem conta: erro, sem sessão e a conta original não muda", async () => {
    const owner = await createLoginUser(PASSWORD, "dono");
    const before = await byEmail(owner.email);
    const r = await signUp(undefined, form({ name: "Intruso", email: owner.email, password: "outra-senha-bem-longa" }));
    expect(r?.error).toMatch(/já tem conta/);
    expect(h.jar.has(SESSION_COOKIE)).toBe(false);
    expect(await byEmail(owner.email)).toEqual(before);
  });

  it("limita as tentativas por IP", async () => {
    for (let i = 0; i < SIGNUP_MAX_PER_IP; i++) {
      await redirectOf(() => signup());
      h.jar.clear();
    }
    const email = newEmail();
    const r = await signUp(undefined, form({ name: "Maria", email, password: PASSWORD }));
    expect(r?.error).toMatch(/Muitas tentativas/);
    expect(await byEmail(email)).toBeUndefined();
  });

  it("pessoa aguardando consegue entrar (para ver a tela de espera)", async () => {
    const u = await createLoginUser(PASSWORD, "espera", { status: "pending" });
    expect(await redirectOf(() => login(undefined, form({ email: u.email, password: PASSWORD })))).toBe("/");
    expect((await getSessionUser())?.status).toBe("pending");
  });

  // Por último: este teste enche o teto de contas aguardando
  it("para de aceitar cadastros quando há contas demais aguardando", async () => {
    for (let i = 0; i < MAX_PENDING; i++) await createTestUser("fila", { status: "pending" });
    const email = newEmail();
    const r = await signUp(undefined, form({ name: "Maria", email, password: PASSWORD }));
    expect(r?.error).toMatch(/indisponíveis/);
    expect(await byEmail(email)).toBeUndefined();
    await cleanupTestUsers(); // libera a fila para não afetar outros testes
  });
});

describe("acesso por status e papel (DAL)", () => {
  it("só conta LIBERADA e comum passa em verifySession", async () => {
    const ok = await createTestUser("ok");
    await loginAs(ok);
    expect((await verifySession()).id).toBe(ok);
  });

  it.each([
    ["aguardando", { status: "pending" as const }, "/aguardando"],
    ["bloqueada", { status: "blocked" as const }, "/aguardando"],
    ["admin", { role: "admin" as const }, "/admin"],
  ])("conta %s é redirecionada e não usa o app", async (_n, opts, to) => {
    const id = await createTestUser("x", opts);
    await loginAs(id);
    expect(await redirectOf(() => verifySession())).toBe(to);
  });

  it("sem sessão vai para o login", async () => {
    expect(await redirectOf(() => verifySession())).toBe("/login");
    expect(await redirectOf(() => verifyAdmin())).toBe("/login");
    expect(await redirectOf(() => verifyAccount())).toBe("/login");
  });

  it("verifyAdmin: só admin liberado", async () => {
    const admin = await createTestUser("adm", { role: "admin" });
    await loginAs(admin);
    expect((await verifyAdmin()).id).toBe(admin);

    h.jar.clear();
    await loginAs(await createTestUser("comum"));
    expect(await redirectOf(() => verifyAdmin())).toBe("/");

    h.jar.clear();
    await loginAs(await createTestUser("adm-bloq", { role: "admin", status: "blocked" }));
    expect(await redirectOf(() => verifyAdmin())).toBe("/aguardando");
  });

  it("verifyAccount aceita qualquer status (tela de espera)", async () => {
    const id = await createTestUser("p", { status: "pending" });
    await loginAs(id);
    expect((await verifyAccount()).status).toBe("pending");
  });

  it("ações do app e das configurações não funcionam para conta aguardando ou bloqueada", async () => {
    for (const status of ["pending", "blocked"] as const) {
      h.jar.clear();
      const id = await createTestUser("sem-acesso", { status });
      await loginAs(id);
      expect(await redirectOf(() => createDayAction(form({ date: "2026-08-01", mode: "empty" })))).toBe("/aguardando");
      expect(await redirectOf(() => updateNameAction(undefined, form({ name: "Novo" })))).toBe("/aguardando");
      expect(await getDay(id, "2026-08-01")).toBeNull();
    }
  });
});

describe("painel do administrador", () => {
  const setStatus = (userId: string, status: string) =>
    setAccountStatusAction(form({ userId, status }));

  it("admin libera uma conta aguardando, e ela passa a usar o app", async () => {
    const pending = await createTestUser("quer-entrar", { status: "pending" });
    const admin = await createTestUser("adm", { role: "admin" });
    await loginAs(admin);
    await setStatus(pending, "approved");
    expect(await statusOf(pending)).toBe("approved");

    h.jar.clear();
    await loginAs(pending);
    expect((await verifySession()).id).toBe(pending);
  });

  it("bloquear derruba as sessões da pessoa na hora, e liberar devolve o acesso", async () => {
    const user = await createTestUser("alvo");
    await loginAs(user);
    const token = h.jar.get(SESSION_COOKIE)!;
    await loginAs(user); // segundo aparelho
    h.jar.clear();

    await loginAs(await createTestUser("adm", { role: "admin" }));
    await setStatus(user, "blocked");
    expect(await db.select().from(sessions).where(eq(sessions.userId, user))).toHaveLength(0);

    h.jar.clear();
    h.jar.set(SESSION_COOKIE, token); // o cookie antigo não vale mais
    expect(await getSessionUser()).toBeNull();

    h.jar.clear();
    await loginAs(await createTestUser("adm2", { role: "admin" }));
    await setStatus(user, "approved");
    expect(await statusOf(user)).toBe("approved");
  });

  it("quem não é admin não consegue liberar nem bloquear (nem conta liberada)", async () => {
    const target = await createTestUser("alvo2", { status: "pending" });
    for (const opts of [{}, { status: "pending" as const }, { status: "blocked" as const }]) {
      h.jar.clear();
      await loginAs(await createTestUser("atacante", opts));
      await redirectOf(() => setStatus(target, "approved"));
      expect(await statusOf(target)).toBe("pending");
    }
    h.jar.clear(); // sem sessão
    expect(await redirectOf(() => setStatus(target, "approved"))).toBe("/login");
    expect(await statusOf(target)).toBe("pending");
  });

  it("admin bloqueado ou sem liberação também não mexe em nada", async () => {
    const target = await createTestUser("alvo3", { status: "pending" });
    await loginAs(await createTestUser("adm-bloq", { role: "admin", status: "blocked" }));
    await redirectOf(() => setStatus(target, "approved"));
    expect(await statusOf(target)).toBe("pending");
  });

  it("não altera contas de administrador (ninguém se bloqueia sem querer)", async () => {
    const other = await createTestUser("outro-adm", { role: "admin" });
    const me = await createTestUser("adm", { role: "admin" });
    await loginAs(me);
    await setStatus(other, "blocked");
    await setStatus(me, "blocked");
    expect(await statusOf(other)).toBe("approved");
    expect(await statusOf(me)).toBe("approved");
  });

  it("recusa status e ids inválidos", async () => {
    const target = await createTestUser("alvo4", { status: "approved" });
    await loginAs(await createTestUser("adm", { role: "admin" }));
    await setStatus(target, "pending"); // não existe "voltar para aguardando"
    await setStatus(target, "admin");
    await setStatus("nao-e-uuid", "blocked");
    expect(await statusOf(target)).toBe("approved");
  });

  it("a lista traz só contas comuns, aguardando primeiro", async () => {
    const adm = await createTestUser("adm-lista", { role: "admin" });
    const ok = await createTestUser("lista-ok");
    const wait = await createTestUser("lista-espera", { status: "pending" });
    const list = await listAccounts();
    const ids = list.map((a) => a.id);
    expect(ids).not.toContain(adm);
    expect(ids.indexOf(wait)).toBeLessThan(ids.indexOf(ok));
  });

  it("toda ação do painel exige sessão de admin", async () => {
    const fns = Object.entries(adminActions).filter(([, fn]) => typeof fn === "function");
    expect(fns.length).toBeGreaterThanOrEqual(1);
    const target = await createTestUser("alvo5", { status: "pending" });
    for (const [name, fn] of fns) {
      h.jar.clear();
      const call = fn as (f: FormData) => Promise<unknown>;
      expect(await redirectOf(() => call(form({ userId: target, status: "approved" }))), name).toBe("/login");
    }
    expect(await statusOf(target)).toBe("pending");
  });
});
