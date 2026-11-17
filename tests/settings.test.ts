import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// CONFIGURAÇÕES: nome, troca de senha e sessões dos aparelhos.
// Código REAL (ações, argon2, sessão, banco de teste). Só cookies/redirect/revalidate são simulados.

const h = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(public url: string) {
      super(`REDIRECT:${url}`);
    }
  }
  return {
    RedirectSignal,
    jar: new Map<string, { value: string; options: Record<string, unknown> }>(),
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
  headers: async () => new Headers({ "x-forwarded-for": "198.51.100.77" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new h.RedirectSignal(url);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  changePasswordAction,
  signOutAllAction,
  signOutOthersAction,
  updateNameAction,
} from "@/app/configuracoes/actions";
import { countActiveSessions } from "@/lib/account";
import { getSessionUser, createSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { clearFailures } from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { cleanupTestUsers, createLoginUser } from "./helpers";

const PASSWORD = "uma-senha-longa-e-correta";
const NEW_PASSWORD = "outra-senha-bem-longa-123";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const pwdForm = (current: string, next: string, confirm = next) =>
  form({ current, next, confirm });

const rows = (userId: string) => db.select().from(sessions).where(eq(sessions.userId, userId));
const passwordHash = async (userId: string) =>
  (await db.select({ h: users.passwordHash }).from(users).where(eq(users.id, userId)))[0].h;
const nameOf = async (userId: string) =>
  (await db.select({ n: users.name }).from(users).where(eq(users.id, userId)))[0].n;

/** Faz o "aparelho" atual entrar como o usuário (cookie no pote) e devolve o token. */
async function loginAs(userId: string) {
  await createSession(userId);
  return h.jar.get(SESSION_COOKIE)!.value;
}

/** Cria uma sessão em OUTRO aparelho (sem mexer no cookie deste). */
async function otherDevice(userId: string) {
  const mine = h.jar.get(SESSION_COOKIE);
  await createSession(userId);
  const other = h.jar.get(SESSION_COOKIE)!.value;
  if (mine) h.jar.set(SESSION_COOKIE, mine);
  else h.jar.delete(SESSION_COOKIE);
  return other;
}

beforeEach(() => {
  h.jar.clear();
});
afterAll(cleanupTestUsers);

describe("alterar nome", () => {
  it("altera o nome do usuário logado", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    const r = await updateNameAction(undefined, form({ name: "  Rafael  " }));
    expect(r?.ok).toBeTruthy();
    expect(await nameOf(u.id)).toBe("Rafael");
  });

  it("não altera o nome de outro usuário, mesmo mandando o id dele no formulário", async () => {
    const me = await createLoginUser(PASSWORD, "eu");
    const other = await createLoginUser(PASSWORD, "outro");
    await loginAs(me.id);
    await updateNameAction(undefined, form({ name: "Novo", userId: other.id, id: other.id }));
    expect(await nameOf(other.id)).toBe("outro");
    expect(await nameOf(me.id)).toBe("Novo");
  });

  it("recusa nome vazio, grande demais ou com caracteres de controle", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    for (const bad of ["   ", "a".repeat(101), "oi\u0000x", "oi\nx"]) {
      const r = await updateNameAction(undefined, form({ name: bad }));
      expect(r?.error, JSON.stringify(bad)).toBeTruthy();
    }
    expect(await nameOf(u.id)).toBe(u.name);
  });

  it("sem sessão, redireciona para o login e não altera nada", async () => {
    const u = await createLoginUser(PASSWORD);
    await expect(updateNameAction(undefined, form({ name: "X" }))).rejects.toBeInstanceOf(
      h.RedirectSignal,
    );
    expect(await nameOf(u.id)).toBe(u.name);
  });
});

describe("alterar senha", () => {
  it("troca a senha: a nova funciona, a antiga não", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    const r = await changePasswordAction(undefined, pwdForm(PASSWORD, NEW_PASSWORD));
    expect(r?.ok).toBeTruthy();
    const hash = await passwordHash(u.id);
    expect(await verifyPassword(hash, NEW_PASSWORD)).toBe(true);
    expect(await verifyPassword(hash, PASSWORD)).toBe(false);
    expect(hash).not.toContain(NEW_PASSWORD);
  });

  it("com a senha atual errada, não troca", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    const before = await passwordHash(u.id);
    const r = await changePasswordAction(undefined, pwdForm("senha-errada-xxxxx", NEW_PASSWORD));
    expect(r?.error).toBe("Senha atual incorreta.");
    expect(await passwordHash(u.id)).toBe(before);
    clearFailures(`pwd:${u.id}`);
  });

  it("recusa senha nova curta, diferente da confirmação, igual à atual ou grande demais", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    const before = await passwordHash(u.id);
    const cases = [
      pwdForm(PASSWORD, "curta"),
      pwdForm(PASSWORD, NEW_PASSWORD, "diferente-da-nova-senha"),
      pwdForm(PASSWORD, PASSWORD),
      pwdForm(PASSWORD, "x".repeat(129)),
      pwdForm("", NEW_PASSWORD),
    ];
    for (const f of cases) {
      const r = await changePasswordAction(undefined, f);
      expect(r?.error).toBeTruthy();
    }
    expect(await passwordHash(u.id)).toBe(before);
  });

  it("encerra TODAS as sessões antigas e dá a este aparelho uma sessão nova", async () => {
    const u = await createLoginUser(PASSWORD);
    const oldToken = await loginAs(u.id);
    const otherToken = await otherDevice(u.id);
    expect(await rows(u.id)).toHaveLength(2);

    await changePasswordAction(undefined, pwdForm(PASSWORD, NEW_PASSWORD));

    const newToken = h.jar.get(SESSION_COOKIE)!.value;
    expect(newToken).not.toBe(oldToken);
    expect(newToken).not.toBe(otherToken);
    expect(await rows(u.id)).toHaveLength(1);
    // Este aparelho continua logado
    expect((await getSessionUser())?.id).toBe(u.id);
    // O outro aparelho foi derrubado
    h.jar.set(SESSION_COOKIE, { value: otherToken, options: {} });
    expect(await getSessionUser()).toBeNull();
  });

  it("limita tentativas erradas da senha atual (5) e bloqueia até a certa", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    clearFailures(`pwd:${u.id}`);
    for (let i = 0; i < 5; i++) {
      const r = await changePasswordAction(undefined, pwdForm("errada-errada-1234", NEW_PASSWORD));
      expect(r?.error).toBe("Senha atual incorreta.");
    }
    const blocked = await changePasswordAction(undefined, pwdForm(PASSWORD, NEW_PASSWORD));
    expect(blocked?.error).toMatch(/Muitas tentativas/);
    expect(await verifyPassword(await passwordHash(u.id), PASSWORD)).toBe(true);
    clearFailures(`pwd:${u.id}`);
  });

  it("sem sessão, redireciona e não troca nada", async () => {
    const u = await createLoginUser(PASSWORD);
    const before = await passwordHash(u.id);
    await expect(
      changePasswordAction(undefined, pwdForm(PASSWORD, NEW_PASSWORD)),
    ).rejects.toBeInstanceOf(h.RedirectSignal);
    expect(await passwordHash(u.id)).toBe(before);
  });
});

describe("aparelhos", () => {
  it("conta só sessões válidas", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    await otherDevice(u.id);
    await db.insert(sessions).values({
      id: "expirada-" + u.id,
      userId: u.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await countActiveSessions(u.id)).toBe(2);
  });

  it("'sair dos outros' mantém este aparelho e derruba os demais", async () => {
    const u = await createLoginUser(PASSWORD);
    const mine = await loginAs(u.id);
    const other = await otherDevice(u.id);

    const r = await signOutOthersAction();
    expect(r?.ok).toBeTruthy();

    expect(await rows(u.id)).toHaveLength(1);
    expect(h.jar.get(SESSION_COOKIE)?.value).toBe(mine);
    expect((await getSessionUser())?.id).toBe(u.id);
    h.jar.set(SESSION_COOKIE, { value: other, options: {} });
    expect(await getSessionUser()).toBeNull();
  });

  it("'sair dos outros' não encerra sessões de OUTRO usuário", async () => {
    const me = await createLoginUser(PASSWORD, "eu");
    const stranger = await createLoginUser(PASSWORD, "estranho");
    await loginAs(me.id);
    await otherDevice(stranger.id);
    await signOutOthersAction();
    expect(await rows(stranger.id)).toHaveLength(1);
  });

  it("'sair de todos' apaga todas as sessões, o cookie e vai para o login", async () => {
    const u = await createLoginUser(PASSWORD);
    await loginAs(u.id);
    await otherDevice(u.id);

    await expect(signOutAllAction()).rejects.toMatchObject({ url: "/login" });

    expect(await rows(u.id)).toHaveLength(0);
    expect(h.jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("sem sessão, as ações de aparelhos redirecionam e não mexem em nada", async () => {
    const u = await createLoginUser(PASSWORD);
    await otherDevice(u.id);
    await expect(signOutOthersAction()).rejects.toBeInstanceOf(h.RedirectSignal);
    await expect(signOutAllAction()).rejects.toBeInstanceOf(h.RedirectSignal);
    expect(await rows(u.id)).toHaveLength(1);
  });
});
