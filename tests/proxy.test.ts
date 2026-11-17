import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

// O proxy é só uma checagem "otimista" (a defesa real está em verifySession),
// mas precisa mandar visitantes sem cookie para o login e não bloquear o próprio login.

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });

describe("proxy", () => {
  it("manda para /login quem não tem cookie de sessão", () => {
    for (const path of ["/", "/?d=2026-03-10", "/modelos", "/configuracoes"]) {
      const res = proxy(req(path));
      expect(res.status, path).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname, path).toBe("/login");
    }
  });

  it("deixa a própria tela de login abrir sem cookie (sem loop de redirecionamento)", () => {
    const res = proxy(req("/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("deixa a tela de cadastro abrir sem cookie, mas protege /admin e /aguardando", () => {
    const open = proxy(req("/cadastro"));
    expect(open.status).toBe(200);
    expect(open.headers.get("location")).toBeNull();
    for (const path of ["/admin", "/aguardando"]) {
      const res = proxy(req(path));
      expect(res.status, path).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname, path).toBe("/login");
    }
  });

  it("deixa passar quem tem cookie de sessão", () => {
    const res = proxy(req("/", "session=qualquer-valor"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
