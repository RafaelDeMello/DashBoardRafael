import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addItem,
  addSection,
  copyDayTo,
  createDay,
  deleteDay,
  getDay,
  getPreviousDayDate,
  getProgressRange,
  renameSection,
  reorderItems,
  reorderSections,
  saveDayAsTemplate,
  setItemDeleted,
  setItemDone,
  setSectionDeleted,
  templateHasContent,
  updateItem,
  type DayData,
} from "@/lib/days";
import { cleanupTestUsers, createTestUser } from "./helpers";

// AUTORIZAÇÃO: um usuário (B, o "invasor") nunca pode ler nem alterar dados de outro (A),
// mesmo conhecendo os ids exatos. Cada teste tenta um ataque e confere que nada mudou.

const DAY = "2026-03-10";
const LATER = "2026-03-12";

let A: string;
let B: string;
let listId: string;
let sectionId: string;
let itemIds: string[];

/** Foto do dia de A, para comparar antes e depois do ataque. */
const snapshot = async (): Promise<DayData | null> => getDay(A, DAY);

beforeAll(async () => {
  A = await createTestUser("dona");
  B = await createTestUser("invasor");

  await createDay(A, DAY, "empty");
  listId = (await getDay(A, DAY))!.id;
  await addSection(A, listId, "Manhã", false);
  sectionId = (await getDay(A, DAY))!.sections[0].id;
  await addItem(A, sectionId, "item 1", false);
  await addItem(A, sectionId, "item 2", false);
  itemIds = (await getDay(A, DAY))!.sections[0].items.map((i) => i.id);
});

afterAll(cleanupTestUsers);

describe("leitura: B não enxerga nada de A", () => {
  it("getDay não devolve o dia de A para B", async () => {
    expect(await getDay(B, DAY)).toBeNull();
  });

  it("getPreviousDayDate e getProgressRange não vazam os dias de A", async () => {
    expect(await getPreviousDayDate(B, "2026-12-31")).toBeNull();
    expect(await getProgressRange(B, "2026-01-01", "2026-12-31")).toEqual({});
  });

  it("controle positivo: A enxerga o próprio dia", async () => {
    const day = await getDay(A, DAY);
    expect(day?.sections[0].items).toHaveLength(2);
    expect(Object.keys(await getProgressRange(A, "2026-01-01", "2026-12-31"))).toContain(DAY);
  });
});

describe("escrita: B não consegue alterar os dados de A", () => {
  it("não adiciona seção na lista de A", async () => {
    const before = await snapshot();
    await addSection(B, listId, "invadida", false);
    await addSection(B, listId, "invadida", true);
    expect(await snapshot()).toEqual(before);
  });

  it("não adiciona item na seção de A", async () => {
    const before = await snapshot();
    await addItem(B, sectionId, "invadido", false);
    await addItem(B, sectionId, "invadido", true);
    expect(await snapshot()).toEqual(before);
  });

  it("não marca nem desmarca item de A", async () => {
    const before = await snapshot();
    await setItemDone(B, itemIds[0], true);
    expect(await snapshot()).toEqual(before);
  });

  it("não edita título nem descrição de item de A", async () => {
    const before = await snapshot();
    await updateItem(B, itemIds[0], { title: "hackeado", description: "x" }, false);
    await updateItem(B, itemIds[0], { title: "hackeado", description: "x" }, true);
    expect(await snapshot()).toEqual(before);
  });

  it("não remove item de A (nem seção de A)", async () => {
    const before = await snapshot();
    await setItemDeleted(B, itemIds[0], true, false);
    await setItemDeleted(B, itemIds[0], true, true);
    await setSectionDeleted(B, sectionId, true, false);
    await setSectionDeleted(B, sectionId, true, true);
    expect(await snapshot()).toEqual(before);
  });

  it("não renomeia seção de A", async () => {
    const before = await snapshot();
    await renameSection(B, sectionId, "hackeada", false);
    await renameSection(B, sectionId, "hackeada", true);
    expect(await snapshot()).toEqual(before);
  });

  it("não reordena itens nem seções de A", async () => {
    const before = await snapshot();
    await reorderItems(B, sectionId, [...itemIds].reverse(), false);
    await reorderItems(B, sectionId, [...itemIds].reverse(), true);
    await reorderSections(B, listId, [sectionId], false);
    expect(await snapshot()).toEqual(before);
  });

  it("não apaga o dia de A (apagar 'a mesma data' só apaga o dia de B)", async () => {
    const before = await snapshot();
    await deleteDay(B, DAY);
    expect(await snapshot()).toEqual(before);
  });
});

describe("cópias e modelo: nada de A atravessa para B", () => {
  it("copyDayTo não copia o dia de A para B", async () => {
    expect(await copyDayTo(B, DAY, LATER)).toBe("missing");
    expect(await getDay(B, LATER)).toBeNull();
    expect(await getDay(A, LATER)).toBeNull();
  });

  it("criar dia 'copiando o anterior' não traz o dia de A para B", async () => {
    await createDay(B, LATER, "copy");
    const day = await getDay(B, LATER);
    expect(day).not.toBeNull();
    expect(day!.sections).toHaveLength(0);
  });

  it("saveDayAsTemplate de B sobre a data de A não cria modelo para B", async () => {
    // B só tem o dia LATER (vazio) e DAY inexistente
    await saveDayAsTemplate(B, DAY);
    expect(await templateHasContent(B)).toBe(false);
  });

  it("criar dia 'do modelo' usa só o modelo de quem pede", async () => {
    await saveDayAsTemplate(A, DAY); // A tem modelo com conteúdo
    expect(await templateHasContent(A)).toBe(true);
    expect(await templateHasContent(B)).toBe(false);

    await createDay(B, "2026-03-20", "template");
    expect((await getDay(B, "2026-03-20"))!.sections).toHaveLength(0);
  });
});

describe("controle positivo: o dono consegue mexer (os testes não são vazios)", () => {
  it("A marca um item e a mudança aparece", async () => {
    await setItemDone(A, itemIds[0], true);
    const day = await getDay(A, DAY);
    expect(day!.sections[0].items.find((i) => i.id === itemIds[0])?.done).toBe(true);
  });

  it("A edita, remove e restaura um item", async () => {
    await updateItem(A, itemIds[1], { title: "editado", description: null }, false);
    expect((await getDay(A, DAY))!.sections[0].items.find((i) => i.id === itemIds[1])?.title).toBe(
      "editado",
    );

    await setItemDeleted(A, itemIds[1], true, false);
    expect((await getDay(A, DAY))!.sections[0].items.map((i) => i.id)).not.toContain(itemIds[1]);

    await setItemDeleted(A, itemIds[1], false, false); // desfazer
    expect((await getDay(A, DAY))!.sections[0].items.map((i) => i.id)).toContain(itemIds[1]);
  });
});
