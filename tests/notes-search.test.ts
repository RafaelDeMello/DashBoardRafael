import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// BUSCA em Notas: por nome e por conteúdo, escopo, curingas do LIKE, apagados e autorização.

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
import { db } from "@/db";
import { noteNodes } from "@/db/schema";
import { createNode, createRepo, deleteNode, deleteRepo, restoreNode, saveFile, searchNotes } from "@/lib/notes";
import { createSession } from "@/lib/session";
import { cleanupTestUsers, createTestUser } from "./helpers";

const val = <T>(r: { ok: boolean; value?: T }): T => {
  expect(r.ok, JSON.stringify(r)).toBe(true);
  return r.value as T;
};
const doc = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });

let B: string;
beforeAll(async () => {
  B = await createTestUser("invasor");
});
afterAll(cleanupTestUsers);

describe("searchNotes", () => {
  it("acha pelo NOME e pelo CONTEÚDO (nota e código), com o caminho das pastas", async () => {
    const u = await createTestUser("busca");
    const repo = val(await createRepo(u, "Estudos"));
    const bd = val(await createNode(u, repo, null, "folder", "Banco de dados"));
    const sql = val(await createNode(u, repo, bd, "folder", "SQL"));
    const nota = val(await createNode(u, repo, sql, "file", "joins.nota"));
    const code = val(await createNode(u, repo, null, "file", "consultas.sql"));
    val(await createNode(u, repo, null, "file", "inner-join.txt")); // só o nome combina
    val(await saveFile(u, nota, doc("INNER JOIN: só o que existe nos dois lados")));
    val(await saveFile(u, code, "SELECT * FROM a\nLEFT JOIN b ON a.id = b.a_id;"));

    const { results, truncated } = await searchNotes(u, "join", null);
    expect(truncated).toBe(false);
    expect(results.map((r) => r.name).sort()).toEqual(["consultas.sql", "inner-join.txt", "joins.nota"]);
    const n = results.find((r) => r.name === "joins.nota")!;
    expect(n.path).toEqual(["Banco de dados", "SQL"]);
    expect(n.repoName).toBe("Estudos");
    expect(n.matches[0]).toMatchObject({ line: 1 });
    expect(results.find((r) => r.name === "inner-join.txt")).toMatchObject({ nameMatch: true, total: 0 });
    expect(results.find((r) => r.name === "consultas.sql")).toMatchObject({ nameMatch: false, total: 1 });
  });

  it("não confunde a estrutura do JSON da nota com texto (buscar 'paragraph' não acha nada)", async () => {
    const u = await createTestUser("json");
    const repo = val(await createRepo(u, "R"));
    const nota = val(await createNode(u, repo, null, "file", "a.nota"));
    val(await saveFile(u, nota, doc("texto comum")));
    expect((await searchNotes(u, "paragraph", null)).results).toEqual([]);
    expect((await searchNotes(u, "comum", null)).results).toHaveLength(1);
  });

  it("curingas do LIKE (% e _) valem como texto comum", async () => {
    const u = await createTestUser("curinga");
    const repo = val(await createRepo(u, "R"));
    const a = val(await createNode(u, repo, null, "file", "a.js"));
    const b = val(await createNode(u, repo, null, "file", "b.js"));
    val(await saveFile(u, a, "desconto de 100% hoje"));
    val(await saveFile(u, b, "algo qualquer"));
    expect((await searchNotes(u, "100%", null)).results.map((r) => r.name)).toEqual(["a.js"]);
    expect((await searchNotes(u, "%%", null)).results).toEqual([]);
    expect((await searchNotes(u, "__", null)).results).toEqual([]);
  });

  it("respeita o escopo: neste repositório ou em todos", async () => {
    const u = await createTestUser("escopo");
    const r1 = val(await createRepo(u, "Um"));
    const r2 = val(await createRepo(u, "Dois"));
    const a = val(await createNode(u, r1, null, "file", "a.js"));
    const b = val(await createNode(u, r2, null, "file", "b.js"));
    val(await saveFile(u, a, "tem alvo aqui"));
    val(await saveFile(u, b, "tem alvo ali"));
    expect((await searchNotes(u, "alvo", r1)).results.map((r) => r.name)).toEqual(["a.js"]);
    expect((await searchNotes(u, "alvo", null)).results.map((r) => r.repoName)).toEqual(["Dois", "Um"]);
  });

  it("ignora o que foi apagado (pasta ou repositório) e volta a achar ao desfazer", async () => {
    const u = await createTestUser("apagados");
    const repo = val(await createRepo(u, "R"));
    const folder = val(await createNode(u, repo, null, "folder", "P"));
    const file = val(await createNode(u, repo, folder, "file", "a.js"));
    val(await saveFile(u, file, "procurado"));
    expect((await searchNotes(u, "procurado", null)).results).toHaveLength(1);
    val(await deleteNode(u, folder));
    expect((await searchNotes(u, "procurado", null)).results).toEqual([]);
    val(await restoreNode(u, folder));
    expect((await searchNotes(u, "procurado", null)).results).toHaveLength(1);
    val(await deleteRepo(u, repo));
    expect((await searchNotes(u, "procurado", null)).results).toEqual([]);
  });

  it("busca curta demais, longa demais ou em repositório alheio não devolve nada", async () => {
    const u = await createTestUser("limites");
    const repo = val(await createRepo(u, "R"));
    const f = val(await createNode(u, repo, null, "file", "a.js"));
    val(await saveFile(u, f, "abc xyz"));
    expect((await searchNotes(u, "a", null)).results).toEqual([]);
    expect((await searchNotes(u, "  ", null)).results).toEqual([]);
    expect((await searchNotes(u, "x".repeat(101), null)).results).toEqual([]);
    expect((await searchNotes(B, "abc", repo)).results).toEqual([]);
  });

  it("limita a quantidade de arquivos e avisa que cortou", async () => {
    const u = await createTestUser("muitos");
    const repo = val(await createRepo(u, "R"));
    for (let i = 0; i < 55; i++) val(await createNode(u, repo, null, "file", `item-${i}.txt`));
    const { results, truncated } = await searchNotes(u, "item", null);
    expect(results).toHaveLength(50);
    expect(truncated).toBe(true);
  });

  it("B não enxerga nada de A (nem pelo nome, nem pelo conteúdo, em nenhum escopo)", async () => {
    const owner = await createTestUser("dono-busca");
    const repo = val(await createRepo(owner, "Privado"));
    const f = val(await createNode(owner, repo, null, "file", "segredo-unico.js"));
    val(await saveFile(owner, f, "conteudo-unico-xyz"));
    expect((await searchNotes(B, "segredo-unico", null)).results).toEqual([]);
    expect((await searchNotes(B, "conteudo-unico", null)).results).toEqual([]);
    expect((await searchNotes(B, "conteudo-unico", repo)).results).toEqual([]);
    expect((await searchNotes(owner, "conteudo-unico", null)).results).toHaveLength(1);
  });

  it("nota salva antes da busca existir (sem texto puro) também é achada, sem falso positivo do JSON", async () => {
    const u = await createTestUser("antiga");
    const repo = val(await createRepo(u, "R"));
    const nota = val(await createNode(u, repo, null, "file", "velha.nota"));
    // simula dado antigo: conteúdo salvo direto, sem search_text
    await db
      .update(noteNodes)
      .set({ content: doc("texto antigo importante"), searchText: null })
      .where(eq(noteNodes.id, nota));
    expect((await searchNotes(u, "importante", null)).results).toHaveLength(1);
    expect((await searchNotes(u, "paragraph", null)).results).toEqual([]);
  });
});

describe("busca: detalhes de implementação", () => {
  it("o texto digitado não vira curinga nem ocupa as vagas do limite com falsos positivos", async () => {
    const u = await createTestUser("vagas");
    const repo = val(await createRepo(u, "R"));
    for (let i = 0; i < 55; i++) {
      const f = val(await createNode(u, repo, null, "file", `aaa-${String(i).padStart(2, "0")}.txt`));
      val(await saveFile(u, f, "abc")); // 'a_c' como curinga acharia todos estes
    }
    const alvo = val(await createNode(u, repo, null, "file", "zzz.txt"));
    val(await saveFile(u, alvo, "a_c"));
    expect((await searchNotes(u, "a_c", null)).results.map((r) => r.name)).toEqual(["zzz.txt"]);
  });

  it("ao salvar uma nota, o texto puro fica guardado para a busca", async () => {
    const u = await createTestUser("textopuro");
    const repo = val(await createRepo(u, "R"));
    const nota = val(await createNode(u, repo, null, "file", "n.nota"));
    const code = val(await createNode(u, repo, null, "file", "c.js"));
    val(await saveFile(u, nota, doc("conteúdo da nota")));
    val(await saveFile(u, code, "const a = 1;"));
    const [n] = await db.select({ t: noteNodes.searchText }).from(noteNodes).where(eq(noteNodes.id, nota));
    const [c] = await db.select({ t: noteNodes.searchText }).from(noteNodes).where(eq(noteNodes.id, code));
    expect(n.t).toBe("conteúdo da nota");
    expect(c.t).toBeNull(); // código é buscado direto no conteúdo
  });
});

describe("searchNotesAction", () => {
  const loginAs = async (id: string) => {
    h.jar.clear();
    await createSession(id);
  };

  it("exige sessão", async () => {
    h.jar.clear();
    await expect(actions.searchNotesAction({ query: "abc", repoId: null })).rejects.toBeInstanceOf(h.RedirectSignal);
  });

  it("devolve só resultados do próprio usuário e valida a entrada", async () => {
    const owner = await createTestUser("dono3");
    const other = await createTestUser("outro3");
    const repo = val(await createRepo(owner, "R"));
    const file = val(await createNode(owner, repo, null, "file", "a.js"));
    await loginAs(owner);
    await actions.saveFileAction({ nodeId: file, content: "palavra-rara-abc" });
    const mine = await actions.searchNotesAction({ query: "palavra-rara", repoId: null });
    expect(mine.ok && mine.results.map((r) => r.name)).toEqual(["a.js"]);
    expect(await actions.searchNotesAction({ query: "xx", repoId: "nao-uuid" })).toEqual({ ok: false, error: "invalid" });
    await loginAs(other);
    const theirs = await actions.searchNotesAction({ query: "palavra-rara", repoId: null });
    expect(theirs.ok && theirs.results).toEqual([]);
  });
});
