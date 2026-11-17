import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// AÇÕES DE NOTAS: exigem sessão de conta liberada, validam a entrada e conferem o nome ao apagar
// um repositório. Código real (ações, DAL, sessão, banco de teste); só cookies/redirect são simulados.

const h = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(public url: string) {
      super(`REDIRECT:${url}`);
    }
  }
  return { RedirectSignal, jar: new Map<string, { value: string; options: Record<string, unknown> }>() };
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
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new h.RedirectSignal(url);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import * as actions from "@/app/notas/actions";
import { getFile, getRepo, getTree, createNode, createRepo, listRepos } from "@/lib/notes";
import { createSession } from "@/lib/session";
import { cleanupTestUsers, createTestUser } from "./helpers";

const uuid = "11111111-1111-4111-8111-111111111111";
const form = (fields: Record<string, string> = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const loginAs = async (id: string) => {
  h.jar.clear();
  await createSession(id);
};
const redirectOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
  } catch (e) {
    if (e instanceof h.RedirectSignal) return e.url;
    throw e;
  }
  return null;
};
const val = <T>(r: { ok: boolean; value?: T }) => {
  expect(r.ok).toBe(true);
  return r.value as T;
};

beforeEach(() => h.jar.clear());
afterAll(cleanupTestUsers);

const all = Object.entries(actions).filter(([, fn]) => typeof fn === "function");

describe("sem sessão, nenhuma ação de Notas funciona", () => {
  it("encontra as ações exportadas (para o teste não ficar vazio por engano)", () => {
    expect(all.length).toBeGreaterThanOrEqual(10);
  });

  it.each(all)("%s manda para o login", async (_name, fn) => {
    const call = fn as (...a: unknown[]) => Promise<unknown>;
    const input = { repoId: uuid, nodeId: uuid, parentId: null, kind: "file", name: "x", confirm: "x", content: "x" };
    expect(await redirectOf(() => call(input, form({ name: "x" })))).toBe("/login");
  });
});

describe("conta que não está liberada, ou é admin, não usa Notas", () => {
  it.each([
    ["aguardando", { status: "pending" as const }, "/aguardando"],
    ["bloqueada", { status: "blocked" as const }, "/aguardando"],
    ["admin", { role: "admin" as const }, "/admin"],
  ])("conta %s é redirecionada e nada é criado", async (_n, opts, to) => {
    const id = await createTestUser("sem-acesso", opts);
    await loginAs(id);
    expect(await redirectOf(() => actions.createRepoAction(undefined, form({ name: "Intruso" })))).toBe(to);
    expect(await listRepos(id)).toEqual([]);
  });
});

describe("repositórios", () => {
  it("criar redireciona para o novo repositório e valida o nome", async () => {
    const u = await createTestUser("cria");
    await loginAs(u);
    expect(await actions.createRepoAction(undefined, form({ name: "   " }))).toEqual({ error: "invalid_name" });
    expect(await actions.createRepoAction(undefined, form({ name: "a/b" }))).toEqual({ error: "invalid_name" });
    const to = await redirectOf(() => actions.createRepoAction(undefined, form({ name: "Estudos" })));
    const [repo] = await listRepos(u);
    expect(to).toBe(`/notas/${repo.id}`);
    expect(await actions.createRepoAction(undefined, form({ name: "estudos" }))).toEqual({ error: "exists" });
  });

  it("apagar exige o NOME EXATO; sem ele, nada é apagado", async () => {
    const u = await createTestUser("apaga");
    await loginAs(u);
    const repo = val(await createRepo(u, "Estudos"));
    expect(await actions.deleteRepoAction({ repoId: repo, confirm: "estudos" })).toEqual({ ok: false, error: "confirm" });
    expect(await actions.deleteRepoAction({ repoId: repo, confirm: "" })).toEqual({ ok: false, error: "confirm" });
    expect(await getRepo(u, repo)).not.toBeNull();
    expect((await actions.deleteRepoAction({ repoId: repo, confirm: "Estudos" })).ok).toBe(true);
    expect(await getRepo(u, repo)).toBeNull();
    expect((await actions.restoreRepoAction({ repoId: repo })).ok).toBe(true);
    expect(await getRepo(u, repo)).not.toBeNull();
  });

  it("não apaga, renomeia nem restaura o repositório de outra pessoa", async () => {
    const owner = await createTestUser("dono");
    const other = await createTestUser("outro");
    const repo = val(await createRepo(owner, "Privado"));
    await loginAs(other);
    expect(await actions.deleteRepoAction({ repoId: repo, confirm: "Privado" })).toEqual({ ok: false, error: "not_found" });
    expect((await actions.renameRepoAction({ repoId: repo, name: "Invadido" })).ok).toBe(false);
    expect((await getRepo(owner, repo))?.name).toBe("Privado");
  });
});

describe("pastas e arquivos", () => {
  it("cria, salva, move, apaga e desfaz pelas ações", async () => {
    const u = await createTestUser("fluxo");
    await loginAs(u);
    const repo = val(await createRepo(u, "R"));
    const folder = (await actions.createNodeAction({ repoId: repo, parentId: null, kind: "folder", name: "Algoritmos" })) as { ok: true; id: string };
    const file = (await actions.createNodeAction({ repoId: repo, parentId: folder.id, kind: "file", name: "busca.js" })) as { ok: true; id: string };
    expect((await actions.saveFileAction({ nodeId: file.id, content: "const a = 1;" })).ok).toBe(true);
    expect((await getFile(u, file.id))?.content).toBe("const a = 1;");
    expect((await actions.moveNodeAction({ nodeId: file.id, repoId: repo, parentId: null })).ok).toBe(true);
    expect((await actions.deleteNodeAction({ nodeId: file.id })).ok).toBe(true);
    expect(await getFile(u, file.id)).toBeNull();
    expect((await actions.restoreNodeAction({ nodeId: file.id })).ok).toBe(true);
    expect(await getFile(u, file.id)).not.toBeNull();
  });

  it("recusa entradas inválidas sem tocar no banco", async () => {
    const u = await createTestUser("invalido");
    await loginAs(u);
    const repo = val(await createRepo(u, "R"));
    expect(await actions.createNodeAction({ repoId: "nao-e-uuid", parentId: null, kind: "file", name: "x" })).toEqual({ ok: false, error: "invalid" });
    expect(await actions.createNodeAction({ repoId: repo, parentId: null, kind: "outro" as never, name: "x" })).toEqual({ ok: false, error: "invalid" });
    expect(await actions.moveNodeAction({ nodeId: "x", repoId: repo, parentId: null })).toEqual({ ok: false, error: "invalid" });
    expect(await actions.createNodeAction({ repoId: repo, parentId: null, kind: "file", name: "a/b" })).toEqual({ ok: false, error: "invalid_name" });
    expect(await getTree(u, repo)).toEqual([]);
  });

  it("não escreve nem apaga arquivos de outra pessoa", async () => {
    const owner = await createTestUser("dono2");
    const other = await createTestUser("outro2");
    const repo = val(await createRepo(owner, "R"));
    const file = val(await createNode(owner, repo, null, "file", "a.js"));
    await loginAs(other);
    expect((await actions.saveFileAction({ nodeId: file, content: "invadido" })).ok).toBe(false);
    expect((await actions.deleteNodeAction({ nodeId: file })).ok).toBe(false);
    expect((await actions.createNodeAction({ repoId: repo, parentId: null, kind: "file", name: "b.js" })).ok).toBe(false);
    expect((await getFile(owner, file))?.content).toBe("");
    expect(await getTree(owner, repo)).toHaveLength(1);
  });

  it("o salvamento recusa conteúdo gigante", async () => {
    const u = await createTestUser("gigante");
    await loginAs(u);
    const repo = val(await createRepo(u, "R"));
    const file = val(await createNode(u, repo, null, "file", "a.js"));
    expect(await actions.saveFileAction({ nodeId: file, content: "x".repeat(600_000) })).toEqual({ ok: false, error: "too_large" });
  });
});
