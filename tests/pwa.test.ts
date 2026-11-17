import { describe, expect, it, vi } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as iconGet } from "@/app/pwa-icon/[size]/route";
import manifest from "@/app/manifest";
import { db } from "@/db";
import { config } from "@/proxy";

// PWA (instalar na tela inicial) e health check. O ponto delicado: o navegador pede o
// manifesto e os ícones SEM estar logado. Se o proxy os mandasse para /login, instalar quebraria.

describe("matcher do proxy: o que é público e o que exige login", () => {
  // O Next compila o matcher como expressão regular sobre o caminho (sem a query)
  const matcher = new RegExp(`^${config.matcher[0]}$`);
  const protegido = (path: string) => matcher.test(path); // true = o proxy roda (exige login)

  it.each([
    "/manifest.webmanifest",
    "/pwa-icon/192",
    "/pwa-icon/512",
    "/pwa-icon/maskable",
    "/icon",
    "/apple-icon",
    "/api/health",
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
    "/qualquer-imagem.png",
  ])("%s é público (o proxy não roda)", (path) => {
    expect(protegido(path)).toBe(false);
  });

  it.each([
    "/",
    "/login",
    "/modelos",
    "/configuracoes",
    "/api/outra-rota",
    "/api/healthz", // só /api/health exato é público
    "/iconografia", // começa com "icon" mas não é o ícone
    "/pwa-iconx",
    "/manifest.webmanifest.bak",
  ])("%s continua protegido", (path) => {
    expect(protegido(path)).toBe(true);
  });
});

describe("manifesto do PWA", () => {
  const m = manifest();

  it("é instalável: nome, start_url, modo standalone e ícones 192 e 512", () => {
    expect(m.name).toBe("Only-Tasks");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("tem um ícone 'maskable' (aparelhos que cortam o ícone em círculo)", () => {
    expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("todos os ícones apontam para rotas que existem e são públicas", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    for (const icon of m.icons ?? []) {
      expect(icon.src.startsWith("/pwa-icon/")).toBe(true);
      expect(matcher.test(icon.src), `${icon.src} exigiria login`).toBe(false);
    }
  });
});

describe("rota dos ícones", () => {
  const call = (size: string) =>
    iconGet(new Request(`http://localhost/pwa-icon/${size}`), { params: Promise.resolve({ size }) });

  it.each(["192", "512", "maskable"])("/pwa-icon/%s devolve um PNG de verdade", async (size) => {
    const res = await call(size);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await res.arrayBuffer());
    // assinatura de um arquivo PNG
    expect(Array.from(bytes.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(res.headers.get("cache-control")).toContain("immutable");
  });

  it.each(["99", "../../etc/passwd", "", "192.png"])("tamanho inválido %j dá 404", async (size) => {
    expect((await call(size)).status).toBe(404);
  });
});

describe("health check", () => {
  it("responde ok quando o banco responde, sem expor dados", async () => {
    const res = await healthGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("responde 503 quando o banco falha e NÃO vaza o motivo do erro", async () => {
    const spy = vi.spyOn(db, "execute").mockRejectedValueOnce(new Error("senha=segredo host=interno"));
    const res = await healthGet();
    spy.mockRestore();

    expect(res.status).toBe(503);
    const text = JSON.stringify(await res.json());
    expect(text).toBe('{"status":"falhou"}');
    expect(text).not.toContain("segredo");
  });
});
