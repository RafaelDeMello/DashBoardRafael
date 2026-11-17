import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addItem,
  addSection,
  createDay,
  createTemplate,
  deleteTemplate,
  getDay,
  getTemplate,
  listTemplates,
  renameTemplate,
  reorderItems,
  saveDayAsTemplate,
  updateItem,
} from "@/lib/days";
import { cleanupTestUsers, createTestUser } from "./helpers";

// MODELOS: vários por usuário, editáveis, usados para criar dias.
// E, como sempre, um usuário nunca mexe nos modelos de outro.

let A: string;
let B: string;

/** Cria um modelo com seções e itens pelo código real (a mesma via do editor). */
async function makeTemplate(user: string, name: string, structure: Record<string, string[]>) {
  const id = (await createTemplate(user, name))!;
  for (const [title, itemTitles] of Object.entries(structure)) {
    await addSection(user, id, title, false);
    const tpl = (await getTemplate(user, id))!;
    const section = tpl.sections.find((s) => s.title === title)!;
    for (const t of itemTitles) await addItem(user, section.id, t, false);
  }
  return id;
}

beforeAll(async () => {
  A = await createTestUser("dona");
  B = await createTestUser("invasor");
});
afterAll(cleanupTestUsers);

describe("criar, listar e ler modelos", () => {
  it("lista com contagens, do mais antigo para o mais novo", async () => {
    const t1 = await makeTemplate(A, "Dia de semana", { Manhã: ["a", "b"], Trabalho: ["c"] });
    const t2 = await makeTemplate(A, "Fim de semana", { Casa: ["d"] });
    const list = await listTemplates(A);
    expect(list.map((t) => t.id)).toEqual([t1, t2]);
    expect(list[0]).toMatchObject({ name: "Dia de semana", sectionCount: 2, itemCount: 3, usedDays: 0 });
    expect(list[1]).toMatchObject({ sectionCount: 1, itemCount: 1 });
  });

  it("modelo recém-criado vem vazio", async () => {
    const user = await createTestUser("vazio");
    const id = (await createTemplate(user, "Vazio"))!;
    expect(await getTemplate(user, id)).toEqual({ id, name: "Vazio", sections: [] });
    expect((await listTemplates(user))[0]).toMatchObject({ sectionCount: 0, itemCount: 0 });
  });

  it("duplicar copia seções e itens, e o original não muda", async () => {
    const user = await createTestUser("dup");
    const original = await makeTemplate(user, "Original", { Manhã: ["x", "y"] });
    const copy = (await createTemplate(user, "Cópia", original))!;
    const o = (await getTemplate(user, original))!;
    const c = (await getTemplate(user, copy))!;
    expect(c.sections.map((s) => [s.title, s.items.map((i) => i.title)])).toEqual([["Manhã", ["x", "y"]]]);
    // ids novos: editar a cópia não mexe no original
    expect(c.sections[0].id).not.toBe(o.sections[0].id);
    await addItem(user, c.sections[0].id, "só na cópia", false);
    expect((await getTemplate(user, original))!.sections[0].items).toHaveLength(2);
  });

  it("editar um modelo (renomear item, reordenar) funciona e não vira 'dia'", async () => {
    const user = await createTestUser("edita");
    const id = await makeTemplate(user, "M", { S: ["um", "dois"] });
    const sec = (await getTemplate(user, id))!.sections[0];
    await updateItem(user, sec.items[0].id, { title: "UM", description: "d" }, false);
    await reorderItems(user, sec.id, [sec.items[1].id, sec.items[0].id], false);
    const after = (await getTemplate(user, id))!.sections[0].items;
    expect(after.map((i) => i.title)).toEqual(["dois", "UM"]);
    expect(after[1].description).toBe("d");
  });

  it("renomeia e apaga o próprio modelo", async () => {
    const user = await createTestUser("rn");
    const id = (await createTemplate(user, "Velho"))!;
    await renameTemplate(user, id, "Novo");
    expect((await getTemplate(user, id))!.name).toBe("Novo");
    await deleteTemplate(user, id);
    expect(await getTemplate(user, id)).toBeNull();
  });
});

describe("usar um modelo para criar o dia", () => {
  it("usa o modelo ESCOLHIDO, não o principal", async () => {
    const user = await createTestUser("usa");
    await makeTemplate(user, "Principal", { Principal: ["p"] });
    const other = await makeTemplate(user, "Outro", { Outro: ["o"] });
    expect(await createDay(user, "2026-05-04", "template", other)).toBe(true);
    const day = (await getDay(user, "2026-05-04"))!;
    expect(day.sections.map((s) => s.title)).toEqual(["Outro"]);
    expect(day.sections[0].items.map((i) => i.title)).toEqual(["o"]);
  });

  it("sem escolher, usa o principal (o mais antigo)", async () => {
    const user = await createTestUser("principal");
    await makeTemplate(user, "Principal", { Principal: ["p"] });
    await makeTemplate(user, "Outro", { Outro: ["o"] });
    await createDay(user, "2026-05-05", "template");
    expect((await getDay(user, "2026-05-05"))!.sections[0].title).toBe("Principal");
  });

  it("dia que já existe: devolve false e não altera o dia", async () => {
    const user = await createTestUser("existe");
    const id = await makeTemplate(user, "M", { S: ["i"] });
    await createDay(user, "2026-05-06", "empty");
    expect(await createDay(user, "2026-05-06", "template", id)).toBe(false);
    expect((await getDay(user, "2026-05-06"))!.sections).toHaveLength(0);
  });

  it("'Sempre' num dia criado do modelo 2 muda o modelo 2, não o principal", async () => {
    const user = await createTestUser("sempre");
    const t1 = await makeTemplate(user, "Principal", { S: ["a"] });
    const t2 = await makeTemplate(user, "Outro", { S: ["b"] });
    await createDay(user, "2026-05-07", "template", t2);
    const day = (await getDay(user, "2026-05-07"))!;
    await addItem(user, day.sections[0].id, "novo-permanente", true);

    const titles = async (id: string) =>
      (await getTemplate(user, id))!.sections[0].items.map((i) => i.title);
    expect(await titles(t2)).toEqual(["b", "novo-permanente"]);
    expect(await titles(t1)).toEqual(["a"]);
  });

  it("conta os dias em que o modelo foi usado", async () => {
    const user = await createTestUser("usado");
    const id = await makeTemplate(user, "M", { S: ["i"] });
    await createDay(user, "2026-05-08", "template", id);
    await createDay(user, "2026-05-09", "template", id);
    expect((await listTemplates(user))[0].usedDays).toBe(2);
  });

  it("apagar o modelo não apaga os dias já criados", async () => {
    const user = await createTestUser("apaga");
    const id = await makeTemplate(user, "M", { S: ["i"] });
    await createDay(user, "2026-05-10", "template", id);
    await deleteTemplate(user, id);
    const day = (await getDay(user, "2026-05-10"))!;
    expect(day.sections[0].items.map((i) => i.title)).toEqual(["i"]);
  });
});

describe("saveDayAsTemplate com modelo escolhido", () => {
  it("substitui só o modelo escolhido", async () => {
    const user = await createTestUser("salva");
    const t1 = await makeTemplate(user, "Principal", { P: ["p"] });
    const t2 = await makeTemplate(user, "Outro", { O: ["o"] });
    await createDay(user, "2026-05-11", "empty");
    const day = (await getDay(user, "2026-05-11"))!;
    await addSection(user, day.id, "Do dia", false);

    await saveDayAsTemplate(user, "2026-05-11", t2);

    expect((await getTemplate(user, t2))!.sections.map((s) => s.title)).toEqual(["Do dia"]);
    expect((await getTemplate(user, t1))!.sections.map((s) => s.title)).toEqual(["P"]);
  });
});

describe("autorização: B não mexe nos modelos de A", () => {
  let tpl: string;
  let sectionId: string;
  let itemId: string;

  beforeAll(async () => {
    tpl = await makeTemplate(A, "Privado", { Segredo: ["item secreto"] });
    const t = (await getTemplate(A, tpl))!;
    sectionId = t.sections[0].id;
    itemId = t.sections[0].items[0].id;
  });

  const intact = async () => {
    const t = (await getTemplate(A, tpl))!;
    expect(t.name).toBe("Privado");
    expect(t.sections.map((s) => [s.title, s.items.map((i) => i.title)])).toEqual([
      ["Segredo", ["item secreto"]],
    ]);
  };

  it("não lê, não lista", async () => {
    expect(await getTemplate(B, tpl)).toBeNull();
    expect((await listTemplates(B)).map((t) => t.id)).not.toContain(tpl);
  });

  it("não renomeia nem apaga", async () => {
    await renameTemplate(B, tpl, "Invadido");
    await deleteTemplate(B, tpl);
    await intact();
  });

  it("não duplica o modelo de A (e nada é criado)", async () => {
    const before = (await listTemplates(B)).length;
    expect(await createTemplate(B, "Roubado", tpl)).toBeNull();
    expect((await listTemplates(B)).length).toBe(before);
  });

  it("não cria um dia a partir do modelo de A (e nenhum dia é criado)", async () => {
    expect(await createDay(B, "2026-06-01", "template", tpl)).toBe(false);
    expect(await getDay(B, "2026-06-01")).toBeNull();
  });

  it("não substitui o modelo de A por um dia seu", async () => {
    await createDay(B, "2026-06-02", "empty");
    const day = (await getDay(B, "2026-06-02"))!;
    await addSection(B, day.id, "Do invasor", false);
    await saveDayAsTemplate(B, "2026-06-02", tpl);
    await intact();
  });

  it("não edita seções e itens dentro do modelo de A", async () => {
    await addSection(B, tpl, "Nova", false);
    await addItem(B, sectionId, "plantado", false);
    await updateItem(B, itemId, { title: "mudado", description: null }, false);
    await intact();
  });
});
