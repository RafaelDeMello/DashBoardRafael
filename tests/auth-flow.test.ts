import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// LOGIN E SESSÃO PONTA A PONTA.
// Usa o código REAL: ação de login, argon2, session.ts, dal.ts, proxy.ts e o banco de teste.
// Só o armazenamento de cookies do Next (next/headers) e o redirect são simulados:
// o "pote de cookies" abaixo faz o papel do navegador.

const h = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(public url: string) {
      super(`REDIRECT:${url}`);
    }
  }
  return {
    RedirectSignal,
    jar: new Map<string, { value: string; options: Record<string, unknown> }>(),
    reqHeaders: {} as Record<string, string>,
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
  headers: async () => new Headers(h.reqHeaders),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new h.RedirectSignal(url);
  },
}));
// Espiona (sem trocar) a verificação de senha: queremos ver SE e COM QUE hash ela é chamada
vi.mock("@/lib/password", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/password")>();
  return {
    ...actual,
    verifyPassword: vi.fn(actual.verifyPassword),
    dummyHash: vi.fn(actual.dummyHash),
  };
});

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { login, logout, type LoginState } from "@/app/login/actions";
import { getCurrentUser, verifySession } from "@/lib/dal";
import { dummyHash, verifyPassword } from "@/lib/password";
import { clearFailures } from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { destroySession, getSessionUser } from "@/lib/session";
import { proxy } from "@/proxy";
import { cleanupTestUsers, createLoginUser } from "./helpers";

const PASSWORD = "uma-senha-longa-e-correta";
const GENERIC = "E-mail ou senha incorretos.";
const DAY = 24 * 60 * 60 * 1000;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const form = (email: unknown, password: unknown) => {
  const f = new FormData();
  if (email !== undefined) f.set("email", String(email));
  if (password !== undefined) f.set("password", String(password));
  return f;
};

/** Tenta entrar; devolve para onde redirecionou (sucesso) ou o estado de erro. */
async function attempt(email: unknown, password: unknown) {
  try {
    const state: LoginState = await login(undefined, form(email, password));
    return { state, redirect: undefined as string | undefined };
  } catch (e) {
    if (e instanceof h.RedirectSignal) return { state: undefined, redirect: e.url };
    throw e;
  }
}

const sessionRows = (userId: string) =>
  db.select().from(sessions).where(eq(sessions.userId, userId));
const cookieValue = () => h.jar.get(SESSION_COOKIE)?.value;

beforeEach(() => {
  h.jar.clear();
  h.reqHeaders = { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}` };
  vi.mocked(verifyPassword).mockClear();
  vi.mocked(dummyHash).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

afterAll(cleanupTestUsers);

describe("login com sucesso", () => {
  it("entra, redireciona para / e cria o cookie de sessão com as proteções certas", async () => {
    const user = await createLoginUser(PASSWORD);
    const r = await attempt(user.email, PASSWORD);
    expect(r.redirect).toBe("/");

    const cookie = h.jar.get(SESSION_COOKIE)!;
    expect(cookie).toBeDefined();
    expect(cookie.options).toMatchObject({
      httpOnly: true, // JavaScript da página não lê o cookie
      sameSite: "lax", // não vai em requisições de outros sites
      path: "/",
      secure: false, // só em produção (testado mais abaixo)
    });
    // vale uns 30 dias
    const exp = (cookie.options.expires as Date).getTime();
    expect(Math.abs(exp - (Date.now() + 30 * DAY))).toBeLessThan(60_000);
    // token com 256 bits aleatórios (base64url ≈ 43 caracteres)
    expect(cookie.value.length).toBeGreaterThanOrEqual(43);
  });

  it("o banco guarda só o SHA-256 do token, nunca o token", async () => {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD);
    const token = cookieValue()!;

    const rows = await sessionRows(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(sha256(token));
    expect(rows[0].id).not.toBe(token);
  });

  it("depois do login, getSessionUser, getCurrentUser e verifySession reconhecem o usuário", async () => {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD);

    const expected = { id: user.id, email: user.email, name: user.name };
    expect(await getSessionUser()).toEqual(expected);
    expect(await getCurrentUser()).toEqual(expected);
    expect(await verifySession()).toEqual(expected);
  });

  it("aceita o e-mail com espaços e letras maiúsculas", async () => {
    const user = await createLoginUser(PASSWORD);
    const r = await attempt(`  ${user.email.toUpperCase()}  `, PASSWORD);
    expect(r.redirect).toBe("/");
  });

  it("cada login cria uma sessão NOVA (token diferente) e os aparelhos coexistem", async () => {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD);
    const first = cookieValue()!;
    await attempt(user.email, PASSWORD);
    const second = cookieValue()!;

    expect(second).not.toBe(first); // sem reaproveitar o token (fixação de sessão)
    expect(await sessionRows(user.id)).toHaveLength(2);
  });
});

describe("login recusado", () => {
  it("senha errada: mensagem genérica, sem cookie e sem sessão no banco", async () => {
    const user = await createLoginUser(PASSWORD);
    const r = await attempt(user.email, "senha-errada-123456");
    expect(r.redirect).toBeUndefined();
    expect(r.state).toEqual({ error: GENERIC, email: user.email });
    expect(h.jar.size).toBe(0);
    expect(await sessionRows(user.id)).toHaveLength(0);
  });

  it("e-mail inexistente dá a MESMA mensagem (não revela quais e-mails têm conta)", async () => {
    const r = await attempt("ninguem@teste.local", PASSWORD);
    expect(r.state?.error).toBe(GENERIC);
    expect(h.jar.size).toBe(0);
  });

  it("e-mail inexistente ainda gasta uma verificação de hash (tempo de resposta igual)", async () => {
    await attempt("ninguem@teste.local", PASSWORD);
    expect(verifyPassword).toHaveBeenCalledTimes(1);
    const usedHash = vi.mocked(verifyPassword).mock.calls[0][0];
    expect(usedHash).toBe(await dummyHash());
  });

  it.each([
    ["e-mail vazio", "", PASSWORD],
    ["e-mail inválido", "isto-nao-e-email", PASSWORD],
    ["senha vazia", "alguem@teste.local", ""],
    ["campos ausentes", undefined, undefined],
    ["tentativa de injeção de SQL", "' or 1=1 --@teste.local", "' or '1'='1"],
  ])("%s: recusa com a mensagem genérica", async (_label, email, password) => {
    const r = await attempt(email, password);
    expect(r.state?.error).toBe(GENERIC);
    expect(h.jar.size).toBe(0);
  });

  it("senha gigante é recusada ANTES de gastar CPU com o hash", async () => {
    const user = await createLoginUser(PASSWORD);
    const r = await attempt(user.email, "a".repeat(129));
    expect(r.state?.error).toBe(GENERIC);
    expect(verifyPassword).not.toHaveBeenCalled();
  });
});

describe("limite de tentativas de login", () => {
  it("bloqueia o e-mail depois de 5 erros, mesmo com a senha certa na 6ª", async () => {
    const user = await createLoginUser(PASSWORD);
    for (let i = 0; i < 5; i++) {
      expect((await attempt(user.email, `errada-${i}-123456`)).state?.error).toBe(GENERIC);
    }
    const blocked = await attempt(user.email, PASSWORD);
    expect(blocked.redirect).toBeUndefined();
    expect(blocked.state?.error).toMatch(/Muitas tentativas/);
    expect(h.jar.size).toBe(0);
    clearFailures(`email:${user.email}`);
  });

  it("o bloqueio expira depois de 15 minutos", async () => {
    const user = await createLoginUser(PASSWORD);
    vi.useFakeTimers({ toFake: ["Date"] });
    for (let i = 0; i < 5; i++) await attempt(user.email, `errada-${i}-123456`);
    expect((await attempt(user.email, PASSWORD)).state?.error).toMatch(/Muitas tentativas/);

    vi.setSystemTime(Date.now() + 16 * 60 * 1000);
    expect((await attempt(user.email, PASSWORD)).redirect).toBe("/");
  });

  it("um login bem-sucedido zera a contagem de erros do e-mail", async () => {
    const user = await createLoginUser(PASSWORD);
    for (let i = 0; i < 4; i++) await attempt(user.email, `errada-${i}-123456`);
    expect((await attempt(user.email, PASSWORD)).redirect).toBe("/"); // zera
    for (let i = 0; i < 4; i++) await attempt(user.email, `errada-${i}-654321`);
    // 4 erros depois do sucesso: ainda não bloqueado
    expect((await attempt(user.email, PASSWORD)).redirect).toBe("/");
  });

  it("bloquear um e-mail não bloqueia outro e-mail (outro IP)", async () => {
    const a = await createLoginUser(PASSWORD, "alvo");
    const b = await createLoginUser(PASSWORD, "outro");
    for (let i = 0; i < 5; i++) await attempt(a.email, `errada-${i}-123456`);

    h.reqHeaders = { "x-forwarded-for": "203.0.113.77" };
    expect((await attempt(b.email, PASSWORD)).redirect).toBe("/");
    clearFailures(`email:${a.email}`);
  });

  it("20 erros vindos do mesmo IP bloqueiam esse IP, mas não outro", async () => {
    const user = await createLoginUser(PASSWORD);
    h.reqHeaders = { "x-forwarded-for": "192.0.2.50" };
    for (let i = 0; i < 20; i++) await attempt(`inexistente-${i}@teste.local`, "qualquer-coisa");

    // o mesmo IP, agora com credenciais certas, está bloqueado
    expect((await attempt(user.email, PASSWORD)).state?.error).toMatch(/Muitas tentativas/);
    // outro IP entra normalmente
    h.reqHeaders = { "x-forwarded-for": "192.0.2.51" };
    expect((await attempt(user.email, PASSWORD)).redirect).toBe("/");
  });
});

describe("sessão: validade, expiração e renovação", () => {
  async function loggedIn() {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD);
    return { user, token: cookieValue()!, id: sha256(cookieValue()!) };
  }

  it("sem cookie, não há usuário", async () => {
    expect(await getSessionUser()).toBeNull();
  });

  it("um token inventado não vale", async () => {
    h.jar.set(SESSION_COOKIE, { value: randomBytes(32).toString("base64url"), options: {} });
    expect(await getSessionUser()).toBeNull();
  });

  it("o valor guardado no BANCO (o hash) não serve como cookie: vazar o banco não vaza sessões", async () => {
    const { id } = await loggedIn();
    h.jar.set(SESSION_COOKIE, { value: id, options: {} });
    expect(await getSessionUser()).toBeNull();
  });

  it("sessão vencida é recusada e removida do banco", async () => {
    const { user, id } = await loggedIn();
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessions.id, id));

    expect(await getSessionUser()).toBeNull();
    expect(await sessionRows(user.id)).toHaveLength(0);
  });

  it("renova o prazo quando faltam menos de 15 dias", async () => {
    const { id } = await loggedIn();
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + 10 * DAY) })
      .where(eq(sessions.id, id));

    expect(await getSessionUser()).not.toBeNull();
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
    expect(Math.abs(row.expiresAt.getTime() - (Date.now() + 30 * DAY))).toBeLessThan(60_000);
  });

  it("NÃO mexe no prazo quando ainda faltam mais de 15 dias", async () => {
    const { id } = await loggedIn();
    const alvo = new Date(Date.now() + 20 * DAY);
    await db.update(sessions).set({ expiresAt: alvo }).where(eq(sessions.id, id));

    await getSessionUser();
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
    expect(row.expiresAt.getTime()).toBe(alvo.getTime());
  });

  it("apagar o usuário derruba as sessões dele", async () => {
    const { user } = await loggedIn();
    await db.delete(users).where(eq(users.id, user.id));
    expect(await getSessionUser()).toBeNull();
    expect(await sessionRows(user.id)).toHaveLength(0);
  });
});

describe("logout", () => {
  it("remove a sessão do banco e o cookie, e redireciona para /login", async () => {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD);

    await expect(logout()).rejects.toMatchObject({ url: "/login" });
    expect(h.jar.has(SESSION_COOKIE)).toBe(false);
    expect(await sessionRows(user.id)).toHaveLength(0);
    expect(await getSessionUser()).toBeNull();
  });

  it("sair em um aparelho não derruba a sessão de outro aparelho do mesmo usuário", async () => {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD); // aparelho 1
    const phoneToken = cookieValue()!;
    await attempt(user.email, PASSWORD); // aparelho 2 (cookie atual)
    expect(await sessionRows(user.id)).toHaveLength(2);

    await destroySession(); // sai no aparelho 2
    expect(await sessionRows(user.id)).toHaveLength(1);

    h.jar.set(SESSION_COOKIE, { value: phoneToken, options: {} }); // volta ao aparelho 1
    expect((await getSessionUser())?.id).toBe(user.id);
  });

  it("o cookie de uma sessão já desconectada não volta a valer", async () => {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD);
    const token = cookieValue()!;
    await destroySession();

    h.jar.set(SESSION_COOKIE, { value: token, options: {} }); // alguém reenvia o token antigo
    expect(await getSessionUser()).toBeNull();
  });
});

describe("duas camadas de proteção: proxy (otimista) + verifySession (real)", () => {
  const req = (cookie?: string) =>
    new NextRequest("http://localhost:3000/", { headers: cookie ? { cookie } : {} });

  it("verifySession sem sessão manda para /login", async () => {
    await expect(verifySession()).rejects.toMatchObject({ url: "/login" });
  });

  it("um cookie FALSO passa pelo proxy (ele só olha se existe), mas a camada real o barra", async () => {
    const fake = `${SESSION_COOKIE}=${randomBytes(16).toString("hex")}`;
    expect(proxy(req(fake)).status).toBe(200); // proxy deixou passar
    h.jar.set(SESSION_COOKIE, { value: fake.split("=")[1], options: {} });
    await expect(verifySession()).rejects.toMatchObject({ url: "/login" }); // dal barrou
  });

  it("com sessão real, as duas camadas deixam passar", async () => {
    const user = await createLoginUser(PASSWORD);
    await attempt(user.email, PASSWORD);
    expect(proxy(req(`${SESSION_COOKIE}=${cookieValue()}`)).status).toBe(200);
    expect((await verifySession()).id).toBe(user.id);
  });
});

describe("produção", () => {
  it("usa o cookie __Host- e marca Secure (só trafega por HTTPS)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const prodCookie = await import("@/lib/session-cookie");
    const prodSession = await import("@/lib/session");
    const user = await createLoginUser(PASSWORD);

    await prodSession.createSession(user.id);

    expect(prodCookie.SESSION_COOKIE).toBe("__Host-session");
    const cookie = h.jar.get("__Host-session")!;
    expect(cookie).toBeDefined();
    expect(cookie.options).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax", path: "/" });
    expect(cookie.options.domain).toBeUndefined(); // __Host- proíbe Domain
  });
});
