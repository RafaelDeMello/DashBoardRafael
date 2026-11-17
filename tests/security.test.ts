import { beforeEach, describe, expect, it, vi } from "vitest";
import { dummyHash, hashPassword, verifyPassword } from "@/lib/password";
import { clearFailures, isBlocked, registerFailure } from "@/lib/rate-limit";

describe("senhas (argon2id)", () => {
  it("guarda um hash argon2id, nunca a senha", async () => {
    const hash = await hashPassword("uma senha bem longa 123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).not.toContain("uma senha");
  });

  it("o mesmo texto gera hashes diferentes (salt aleatório)", async () => {
    const [a, b] = await Promise.all([hashPassword("repetida"), hashPassword("repetida")]);
    expect(a).not.toBe(b);
  });

  it("confere a senha certa e recusa a errada", async () => {
    const hash = await hashPassword("correta-123456");
    expect(await verifyPassword(hash, "correta-123456")).toBe(true);
    expect(await verifyPassword(hash, "errada-123456")).toBe(false);
  });

  it("um hash inválido é recusado em vez de quebrar", async () => {
    expect(await verifyPassword("isto-nao-e-um-hash", "qualquer")).toBe(false);
  });

  it("o hash 'de mentira' existe e é verificável (iguala o tempo do login com e-mail errado)", async () => {
    const hash = await dummyHash();
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "senha-qualquer")).toBe(false);
  });
});

describe("limite de tentativas de login", () => {
  beforeEach(() => {
    clearFailures("email:a@teste.local");
    clearFailures("email:b@teste.local");
  });

  it("bloqueia depois do máximo de erros", () => {
    const key = "email:a@teste.local";
    for (let i = 0; i < 4; i++) registerFailure(key, 60_000);
    expect(isBlocked(key, 5)).toBe(false);
    registerFailure(key, 60_000);
    expect(isBlocked(key, 5)).toBe(true);
  });

  it("um e-mail bloqueado não bloqueia outro", () => {
    for (let i = 0; i < 5; i++) registerFailure("email:a@teste.local", 60_000);
    expect(isBlocked("email:a@teste.local", 5)).toBe(true);
    expect(isBlocked("email:b@teste.local", 5)).toBe(false);
  });

  it("login certo (clearFailures) zera a contagem", () => {
    const key = "email:a@teste.local";
    for (let i = 0; i < 5; i++) registerFailure(key, 60_000);
    clearFailures(key);
    expect(isBlocked(key, 5)).toBe(false);
  });

  it("o bloqueio expira com o tempo", () => {
    vi.useFakeTimers();
    try {
      const key = "email:a@teste.local";
      for (let i = 0; i < 5; i++) registerFailure(key, 1_000);
      expect(isBlocked(key, 5)).toBe(true);
      vi.advanceTimersByTime(1_500);
      expect(isBlocked(key, 5)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
