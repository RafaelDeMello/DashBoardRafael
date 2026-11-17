import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createNode,
  createRepo,
  deleteNode,
  deleteRepo,
  getFile,
  getRepo,
  getTree,
  listRepos,
  moveNode,
  renameNode,
  renameRepo,
  restoreNode,
  restoreRepo,
  saveFile,
} from "@/lib/notes";
import { MAX_CONTENT, MAX_DEPTH, MAX_REPOS } from "@/lib/note-names";
import { cleanupTestUsers, createTestUser } from "./helpers";

// NOTAS: repositórios, pastas e arquivos. Regras de nome, profundidade, mover (sem ciclos),
// apagar e desfazer, e — como sempre — um usuário nunca mexe nos dados de outro.

let A: string;
let B: string;

const val = <T>(r: { ok: boolean; value?: T; error?: string }): T => {
  expect(r.ok, JSON.stringify(r)).toBe(true);
  return r.value as T;
};
const names = async (u: string, repo: string) =>
  (await getTree(u, repo))!.map((n) => n.name).sort();

beforeAll(async () => {
  A = await createTestUser("dona");
  B = await createTestUser("invasor");
});
afterAll(cleanupTestUsers);

describe("repositórios", () => {
  it("cria, lista com contagem de arquivos e renomeia", async () => {
    const u = await createTestUser("repos");
    const repo = val(await createRepo(u, "Estudos"));
    val(await createNode(u, repo, null, "file", "a.nota"));
    val(await createNode(u, repo, null, "file", "b.js"));
    val(await createNode(u, repo, null, "folder", "Pasta"));
    expect(await listRepos(u)).toMatchObject([{ id: repo, name: "Estudos", files: 2 }]);
    val(await renameRepo(u, repo, "Faculdade"));
    expect((await getRepo(u, repo))?.name).toBe("Faculdade");
  });

  it("recusa nome inválido e nome repetido (sem diferenciar maiúsculas)", async () => {
    const u = await createTestUser("nomes");
    expect(await createRepo(u, "  ")).toEqual({ ok: false, error: "invalid_name" });
    expect(await createRepo(u, "a/b")).toEqual({ ok: false, error: "invalid_name" });
    val(await createRepo(u, "Estudos"));
    expect(await createRepo(u, "estudos")).toEqual({ ok: false, error: "exists" });
    // o mesmo nome em OUTRA conta é permitido
    val(await createRepo(B, "Estudos"));
  });

  it("limita a quantidade de repositórios", async () => {
    const u = await createTestUser("limite");
    for (let i = 0; i < MAX_REPOS; i++) val(await createRepo(u, `repo ${i}`));
    expect(await createRepo(u, "um a mais")).toEqual({ ok: false, error: "limit" });
  });

  it("apagar é reversível; repositório apagado some da lista e das consultas", async () => {
    const u = await createTestUser("apaga");
    const repo = val(await createRepo(u, "Temp"));
    const file = val(await createNode(u, repo, null, "file", "x.nota"));
    val(await deleteRepo(u, repo));
    expect(await listRepos(u)).toEqual([]);
    expect(await getTree(u, repo)).toBeNull();
    expect(await getFile(u, file)).toBeNull();
    val(await restoreRepo(u, repo));
    expect((await listRepos(u))[0].files).toBe(1);
    expect(await getFile(u, file)).not.toBeNull();
  });

  it("restaurar com o nome já ocupado volta com ' (restaurado)'", async () => {
    const u = await createTestUser("restaura");
    const first = val(await createRepo(u, "Estudos"));
    val(await deleteRepo(u, first));
    val(await createRepo(u, "Estudos"));
    val(await restoreRepo(u, first));
    expect((await listRepos(u)).map((r) => r.name).sort()).toEqual(["Estudos", "Estudos (restaurado)"]);
  });
});

describe("pastas e arquivos", () => {
  it("cria em cascata e devolve a árvore", async () => {
    const u = await createTestUser("arvore");
    const repo = val(await createRepo(u, "R"));
    const db = val(await createNode(u, repo, null, "folder", "Banco de dados", "database"));
    const sql = val(await createNode(u, repo, db, "folder", "SQL"));
    val(await createNode(u, repo, sql, "file", "joins.nota"));
    const tree = (await getTree(u, repo))!;
    expect(tree).toHaveLength(3);
    expect(tree.find((n) => n.name === "Banco de dados")).toMatchObject({ icon: "database", parentId: null });
    expect(tree.find((n) => n.name === "joins.nota")).toMatchObject({ parentId: sql, kind: "file" });
  });

  it("não aceita nome repetido na mesma pasta, mas aceita em pastas diferentes", async () => {
    const u = await createTestUser("dup");
    const repo = val(await createRepo(u, "R"));
    const p1 = val(await createNode(u, repo, null, "folder", "P1"));
    const p2 = val(await createNode(u, repo, null, "folder", "P2"));
    val(await createNode(u, repo, p1, "file", "a.js"));
    expect(await createNode(u, repo, p1, "file", "A.JS")).toEqual({ ok: false, error: "exists" });
    val(await createNode(u, repo, p2, "file", "a.js"));
    expect(await createNode(u, repo, null, "folder", "p1")).toEqual({ ok: false, error: "exists" });
  });

  it("arquivo não pode ter filhos, e o pai precisa ser do mesmo repositório", async () => {
    const u = await createTestUser("pai");
    const r1 = val(await createRepo(u, "R1"));
    const r2 = val(await createRepo(u, "R2"));
    const file = val(await createNode(u, r1, null, "file", "a.nota"));
    const folder2 = val(await createNode(u, r2, null, "folder", "P"));
    expect(await createNode(u, r1, file, "file", "b.nota")).toEqual({ ok: false, error: "not_found" });
    expect(await createNode(u, r1, folder2, "file", "b.nota")).toEqual({ ok: false, error: "not_found" });
  });

  it(`limita a profundidade a ${MAX_DEPTH} níveis`, async () => {
    const u = await createTestUser("fundo");
    const repo = val(await createRepo(u, "R"));
    let parent: string | null = null;
    for (let i = 1; i <= MAX_DEPTH; i++) parent = val(await createNode(u, repo, parent, "folder", `n${i}`));
    expect(await createNode(u, repo, parent, "folder", "fundo demais")).toEqual({ ok: false, error: "depth" });
    expect(await createNode(u, repo, parent, "file", "x.nota")).toEqual({ ok: false, error: "depth" });
  });

  it("renomeia pasta (e troca o ícone) e arquivo", async () => {
    const u = await createTestUser("renomeia");
    const repo = val(await createRepo(u, "R"));
    const folder = val(await createNode(u, repo, null, "folder", "Velha"));
    const file = val(await createNode(u, repo, folder, "file", "x.nota"));
    val(await renameNode(u, folder, "Nova", "lock"));
    val(await renameNode(u, file, "y.nota"));
    const tree = (await getTree(u, repo))!;
    expect(tree.find((n) => n.id === folder)).toMatchObject({ name: "Nova", icon: "lock" });
    expect(tree.find((n) => n.id === file)?.name).toBe("y.nota");
    expect(await renameNode(u, file, "a/b")).toEqual({ ok: false, error: "invalid_name" });
  });

  it("renomear para uma extensão de outro tipo só vale se o arquivo estiver vazio", async () => {
    const u = await createTestUser("tipo");
    const repo = val(await createRepo(u, "R"));
    const empty = val(await createNode(u, repo, null, "file", "vazio.nota"));
    val(await renameNode(u, empty, "vazio.js"));
    const full = val(await createNode(u, repo, null, "file", "cheio.nota"));
    val(await saveFile(u, full, JSON.stringify({ type: "doc", content: [] })));
    expect(await renameNode(u, full, "cheio.js")).toEqual({ ok: false, error: "type_change" });
    val(await renameNode(u, full, "outro.nota"));
  });
});

describe("mover", () => {
  it("move arquivo e pasta (com tudo dentro) para outra pasta e para a raiz", async () => {
    const u = await createTestUser("move");
    const repo = val(await createRepo(u, "R"));
    const a = val(await createNode(u, repo, null, "folder", "A"));
    const b = val(await createNode(u, repo, null, "folder", "B"));
    const f = val(await createNode(u, repo, a, "file", "f.nota"));
    val(await moveNode(u, f, repo, b));
    expect((await getTree(u, repo))!.find((n) => n.id === f)?.parentId).toBe(b);
    val(await moveNode(u, a, repo, b)); // pasta inteira para dentro de B
    expect((await getTree(u, repo))!.find((n) => n.id === a)?.parentId).toBe(b);
    val(await moveNode(u, f, repo, null)); // para a raiz
    expect((await getTree(u, repo))!.find((n) => n.id === f)?.parentId).toBeNull();
  });

  it("impede ciclos: pasta dentro dela mesma ou de uma subpasta", async () => {
    const u = await createTestUser("ciclo");
    const repo = val(await createRepo(u, "R"));
    const a = val(await createNode(u, repo, null, "folder", "A"));
    const b = val(await createNode(u, repo, a, "folder", "B"));
    const c = val(await createNode(u, repo, b, "folder", "C"));
    expect(await moveNode(u, a, repo, a)).toEqual({ ok: false, error: "cycle" });
    expect(await moveNode(u, a, repo, c)).toEqual({ ok: false, error: "cycle" });
    expect((await getTree(u, repo))!.find((n) => n.id === a)?.parentId).toBeNull();
  });

  it("impede mover para dentro de um arquivo ou para um destino com o nome já usado", async () => {
    const u = await createTestUser("destino");
    const repo = val(await createRepo(u, "R"));
    const file = val(await createNode(u, repo, null, "file", "a.nota"));
    const other = val(await createNode(u, repo, null, "file", "b.nota"));
    expect(await moveNode(u, other, repo, file)).toEqual({ ok: false, error: "not_found" });
    const folder = val(await createNode(u, repo, null, "folder", "P"));
    val(await createNode(u, repo, folder, "file", "b.nota"));
    expect(await moveNode(u, other, repo, folder)).toEqual({ ok: false, error: "exists" });
  });

  it("respeita a profundidade máxima ao mover uma pasta com subpastas", async () => {
    const u = await createTestUser("prof");
    const repo = val(await createRepo(u, "R"));
    let deep: string | null = null;
    for (let i = 1; i <= MAX_DEPTH - 1; i++) deep = val(await createNode(u, repo, deep, "folder", `n${i}`));
    const top = val(await createNode(u, repo, null, "folder", "topo"));
    val(await createNode(u, repo, top, "folder", "filha")); // topo tem altura 1
    expect(await moveNode(u, top, repo, deep)).toEqual({ ok: false, error: "depth" });
  });

  it("move entre repositórios, levando tudo que está dentro", async () => {
    const u = await createTestUser("entre");
    const r1 = val(await createRepo(u, "R1"));
    const r2 = val(await createRepo(u, "R2"));
    const folder = val(await createNode(u, r1, null, "folder", "P"));
    val(await createNode(u, r1, folder, "file", "x.nota"));
    val(await moveNode(u, folder, r2, null));
    expect(await names(u, r1)).toEqual([]);
    expect(await names(u, r2)).toEqual(["P", "x.nota"]);
  });
});

describe("apagar e desfazer", () => {
  it("apagar pasta leva o que está dentro; desfazer traz tudo de volta", async () => {
    const u = await createTestUser("desfaz");
    const repo = val(await createRepo(u, "R"));
    const folder = val(await createNode(u, repo, null, "folder", "P"));
    const sub = val(await createNode(u, repo, folder, "folder", "S"));
    val(await createNode(u, repo, sub, "file", "x.nota"));
    val(await deleteNode(u, folder));
    expect(await names(u, repo)).toEqual([]);
    val(await restoreNode(u, folder));
    expect(await names(u, repo)).toEqual(["P", "S", "x.nota"]);
  });

  it("não ressuscita o que já tinha sido apagado ANTES da pasta", async () => {
    const u = await createTestUser("antes");
    const repo = val(await createRepo(u, "R"));
    const folder = val(await createNode(u, repo, null, "folder", "P"));
    const old = val(await createNode(u, repo, folder, "file", "velho.nota"));
    val(await createNode(u, repo, folder, "file", "novo.nota"));
    val(await deleteNode(u, old));
    await new Promise((r) => setTimeout(r, 5));
    val(await deleteNode(u, folder));
    val(await restoreNode(u, folder));
    expect(await names(u, repo)).toEqual(["P", "novo.nota"]);
  });

  it("restaurar com o nome ocupado volta com ' (restaurado)'", async () => {
    const u = await createTestUser("ocupado");
    const repo = val(await createRepo(u, "R"));
    const f = val(await createNode(u, repo, null, "file", "a.nota"));
    val(await deleteNode(u, f));
    val(await createNode(u, repo, null, "file", "a.nota"));
    val(await restoreNode(u, f));
    // o sufixo entra ANTES da extensão: o arquivo continua sendo uma nota
    expect(await names(u, repo)).toEqual(["a (restaurado).nota", "a.nota"]);
  });

  it("se a pasta de origem também foi apagada, volta para a raiz", async () => {
    const u = await createTestUser("raiz");
    const repo = val(await createRepo(u, "R"));
    const folder = val(await createNode(u, repo, null, "folder", "P"));
    const file = val(await createNode(u, repo, folder, "file", "a.nota"));
    val(await deleteNode(u, file));
    val(await deleteNode(u, folder));
    val(await restoreNode(u, file));
    expect((await getTree(u, repo))!.find((n) => n.id === file)?.parentId).toBeNull();
  });

  it("apagar um nó que não existe ou já foi apagado falha sem efeito", async () => {
    const u = await createTestUser("nada");
    const repo = val(await createRepo(u, "R"));
    const f = val(await createNode(u, repo, null, "file", "a.nota"));
    val(await deleteNode(u, f));
    expect(await deleteNode(u, f)).toEqual({ ok: false, error: "not_found" });
    expect(await restoreNode(u, "11111111-1111-4111-8111-111111111111")).toEqual({ ok: false, error: "not_found" });
  });
});

describe("conteúdo dos arquivos", () => {
  it("salva e lê; nota exige JSON de documento, código aceita texto livre", async () => {
    const u = await createTestUser("conteudo");
    const repo = val(await createRepo(u, "R"));
    const nota = val(await createNode(u, repo, null, "file", "a.nota"));
    const code = val(await createNode(u, repo, null, "file", "a.js"));
    const doc = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
    val(await saveFile(u, nota, doc));
    expect((await getFile(u, nota))?.content).toBe(doc);
    val(await saveFile(u, code, "const a = 1;"));
    expect((await getFile(u, code))?.content).toBe("const a = 1;");
    expect(await saveFile(u, nota, "texto solto")).toEqual({ ok: false, error: "invalid_content" });
    expect(await saveFile(u, nota, JSON.stringify({ type: "outra" }))).toEqual({ ok: false, error: "invalid_content" });
  });

  it("recusa arquivo grande demais", async () => {
    const u = await createTestUser("grande");
    const repo = val(await createRepo(u, "R"));
    const code = val(await createNode(u, repo, null, "file", "a.js"));
    expect(await saveFile(u, code, "x".repeat(MAX_CONTENT + 1))).toEqual({ ok: false, error: "too_large" });
    val(await saveFile(u, code, "x".repeat(MAX_CONTENT)));
  });

  it("pasta não tem conteúdo", async () => {
    const u = await createTestUser("pasta");
    const repo = val(await createRepo(u, "R"));
    const folder = val(await createNode(u, repo, null, "folder", "P"));
    expect(await getFile(u, folder)).toBeNull();
    expect(await saveFile(u, folder, "x")).toEqual({ ok: false, error: "not_found" });
  });
});

describe("autorização: B não mexe nas notas de A", () => {
  let repo: string;
  let folder: string;
  let file: string;
  const doc = JSON.stringify({ type: "doc", content: [] });

  beforeAll(async () => {
    repo = val(await createRepo(A, "Privado"));
    folder = val(await createNode(A, repo, null, "folder", "Pasta"));
    file = val(await createNode(A, repo, folder, "file", "segredo.nota"));
    val(await saveFile(A, file, doc));
  });

  const intact = async () => {
    expect((await getRepo(A, repo))?.name).toBe("Privado");
    expect(await names(A, repo)).toEqual(["Pasta", "segredo.nota"]);
    expect((await getFile(A, file))?.content).toBe(doc);
  };

  it("não lê repositório, árvore nem arquivo", async () => {
    expect(await getRepo(B, repo)).toBeNull();
    expect(await getTree(B, repo)).toBeNull();
    expect(await getFile(B, file)).toBeNull();
    expect((await listRepos(B)).map((r) => r.id)).not.toContain(repo);
  });

  it("não cria dentro do repositório ou da pasta de A", async () => {
    expect((await createNode(B, repo, null, "file", "x.nota")).ok).toBe(false);
    expect((await createNode(B, repo, folder, "file", "x.nota")).ok).toBe(false);
    await intact();
  });

  it("não renomeia, não apaga e não restaura", async () => {
    expect((await renameRepo(B, repo, "Invadido")).ok).toBe(false);
    expect((await deleteRepo(B, repo)).ok).toBe(false);
    expect((await renameNode(B, file, "x.nota")).ok).toBe(false);
    expect((await deleteNode(B, file)).ok).toBe(false);
    await intact();
    val(await deleteNode(A, file));
    expect((await restoreNode(B, file)).ok).toBe(false);
    val(await restoreNode(A, file));
    await intact();
  });

  it("não escreve no arquivo de A", async () => {
    expect((await saveFile(B, file, doc.replace("[]", "[1]"))).ok).toBe(false);
    await intact();
  });

  it("não move arquivo de A para o repositório de B, nem o contrário", async () => {
    const mine = val(await createRepo(B, "Meu"));
    const myFile = val(await createNode(B, mine, null, "file", "meu.nota"));
    expect((await moveNode(B, file, mine, null)).ok).toBe(false);
    expect((await moveNode(B, myFile, repo, null)).ok).toBe(false);
    expect((await moveNode(B, myFile, repo, folder)).ok).toBe(false);
    expect((await moveNode(A, file, mine, null)).ok).toBe(false);
    await intact();
    expect(await names(B, mine)).toEqual(["meu.nota"]);
  });
});
