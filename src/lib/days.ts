import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, lists, sections } from "@/db/schema";
import type { DayProgress } from "@/lib/progress";

// Camada de dados dos dias. REGRAS:
// 1) Toda função recebe o userId da sessão e só toca em linhas desse usuário
//    (evita que alguém mexa em dados de outra pessoa trocando um id na requisição).
// 2) "Remover" é reversível: marca deleted_at. Tudo que lê filtra deleted_at IS NULL.
// 3) Mudança "permanente" = aplicada também ao MODELO padrão do usuário. A ligação
//    entre uma linha do dia e a do modelo é a coluna source_id.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
/** Aceita tanto o db quanto uma transação. */
type Executor = Pick<Tx, "select" | "insert" | "update" | "delete">;

type SectionRow = typeof sections.$inferSelect;
type ItemRow = typeof items.$inferSelect;

export type ItemData = {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
};
export type SectionData = { id: string; title: string; items: ItemData[] };
export type DayData = { id: string; date: string; sections: SectionData[] };

// ---------- Leitura ----------

async function loadSections(ex: Executor, listId: string) {
  const secs = await ex
    .select()
    .from(sections)
    .where(and(eq(sections.listId, listId), isNull(sections.deletedAt)))
    .orderBy(asc(sections.position), asc(sections.id));

  const its = secs.length
    ? await ex
        .select()
        .from(items)
        .where(
          and(
            inArray(
              items.sectionId,
              secs.map((s) => s.id),
            ),
            isNull(items.deletedAt),
          ),
        )
        .orderBy(asc(items.position), asc(items.id))
    : [];

  return secs.map((s) => ({ ...s, items: its.filter((i) => i.sectionId === s.id) }));
}

async function findDay(ex: Executor, userId: string, date: string) {
  const [list] = await ex
    .select()
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.kind, "day"), eq(lists.date, date)))
    .limit(1);
  return list;
}

export async function getDay(userId: string, date: string): Promise<DayData | null> {
  const list = await findDay(db, userId, date);
  if (!list) return null;
  const secs = await loadSections(db, list.id);
  return {
    id: list.id,
    date,
    sections: secs.map((s) => ({
      id: s.id,
      title: s.title,
      items: s.items.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        done: i.done,
      })),
    })),
  };
}

/** Data do dia mais recente anterior a `date` (para oferecer "copiar o dia anterior"). */
export async function getPreviousDayDate(userId: string, date: string): Promise<string | null> {
  const [row] = await db
    .select({ date: lists.date })
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.kind, "day"), lt(lists.date, date)))
    .orderBy(desc(lists.date))
    .limit(1);
  return row?.date ?? null;
}

/** Itens feitos / total de cada dia no intervalo (para calendário e sequência). */
export async function getProgressRange(
  userId: string,
  from: string,
  to: string,
): Promise<Record<string, DayProgress>> {
  const rows = await db
    .select({
      date: lists.date,
      total: sql<number>`count(${items.id})::int`,
      done: sql<number>`(count(${items.id}) filter (where ${items.done}))::int`,
    })
    .from(lists)
    .leftJoin(sections, and(eq(sections.listId, lists.id), isNull(sections.deletedAt)))
    .leftJoin(items, and(eq(items.sectionId, sections.id), isNull(items.deletedAt)))
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.kind, "day"),
        gte(lists.date, from),
        lte(lists.date, to),
      ),
    )
    .groupBy(lists.date);

  const result: Record<string, DayProgress> = {};
  for (const r of rows) if (r.date) result[r.date] = { total: r.total, done: r.done };
  return result;
}

// ---------- Modelo padrão ----------

/** Id do modelo padrão do usuário (o mais antigo). Com `create`, cria se não existir. */
async function getTemplateId(ex: Executor, userId: string, create: true): Promise<string>;
async function getTemplateId(ex: Executor, userId: string, create: false): Promise<string | null>;
async function getTemplateId(ex: Executor, userId: string, create: boolean) {
  const [tpl] = await ex
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.kind, "template")))
    .orderBy(asc(lists.createdAt))
    .limit(1);
  if (tpl) return tpl.id;
  if (!create) return null;
  const [created] = await ex
    .insert(lists)
    .values({ userId, kind: "template", name: "Modelo padrão" })
    .returning({ id: lists.id });
  return created.id;
}

/** Existe um modelo com pelo menos uma seção? (para oferecer "Usar o modelo") */
export async function templateHasContent(userId: string): Promise<boolean> {
  const tplId = await getTemplateId(db, userId, false);
  if (!tplId) return false;
  const [row] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.listId, tplId), isNull(sections.deletedAt)))
    .limit(1);
  return !!row;
}

// ---------- Criar, copiar e apagar dias ----------

/**
 * Copia seções e itens (tudo desmarcado) de uma lista para outra.
 * link "self": o destino aponta para as linhas da origem (dia nascendo do modelo).
 * link "keep": o destino herda o source_id da origem (dia copiado de outro dia).
 */
async function copyStructure(tx: Tx, fromListId: string, toListId: string, link: "self" | "keep") {
  const secs = await loadSections(tx, fromListId);
  for (const s of secs) {
    const [copy] = await tx
      .insert(sections)
      .values({
        listId: toListId,
        title: s.title,
        position: s.position,
        sourceId: link === "self" ? s.id : s.sourceId,
      })
      .returning({ id: sections.id });
    if (s.items.length) {
      await tx.insert(items).values(
        s.items.map((i) => ({
          sectionId: copy.id,
          title: i.title,
          description: i.description,
          position: i.position,
          sourceId: link === "self" ? i.id : i.sourceId,
        })),
      );
    }
  }
}

export type CreateMode = "empty" | "copy" | "template";

/** Cria o dia: vazio, copiando o dia anterior ou a partir do modelo. */
export async function createDay(userId: string, date: string, mode: CreateMode) {
  await db.transaction(async (tx) => {
    // ON CONFLICT DO NOTHING: se o dia já existe (duplo clique), não faz nada
    const [created] = await tx
      .insert(lists)
      .values({ userId, kind: "day", name: date, date })
      .onConflictDoNothing()
      .returning({ id: lists.id });
    if (!created || mode === "empty") return;

    if (mode === "template") {
      const tplId = await getTemplateId(tx, userId, false);
      if (tplId) await copyStructure(tx, tplId, created.id, "self");
      return;
    }

    const [prev] = await tx
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.kind, "day"), lt(lists.date, date)))
      .orderBy(desc(lists.date))
      .limit(1);
    if (prev) await copyStructure(tx, prev.id, created.id, "keep");
  });
}

/** Copia um dia existente para outra data (que ainda não pode ter lista). */
export async function copyDayTo(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<"ok" | "missing" | "exists"> {
  return db.transaction(async (tx) => {
    const source = await findDay(tx, userId, fromDate);
    if (!source) return "missing";
    const [created] = await tx
      .insert(lists)
      .values({ userId, kind: "day", name: toDate, date: toDate })
      .onConflictDoNothing()
      .returning({ id: lists.id });
    if (!created) return "exists";
    await copyStructure(tx, source.id, created.id, "keep");
    return "ok";
  });
}

/** Apaga o dia inteiro (seções e itens saem junto, por cascade). */
export async function deleteDay(userId: string, date: string) {
  await db
    .delete(lists)
    .where(and(eq(lists.userId, userId), eq(lists.kind, "day"), eq(lists.date, date)));
}

/** Substitui o modelo padrão pela estrutura deste dia. */
export async function saveDayAsTemplate(userId: string, date: string) {
  await db.transaction(async (tx) => {
    const day = await findDay(tx, userId, date);
    if (!day) return;
    const tplId = await getTemplateId(tx, userId, true);

    // Zera o modelo (os source_id que apontavam para ele viram NULL sozinhos)
    await tx.delete(sections).where(eq(sections.listId, tplId));

    const secs = await loadSections(tx, day.id);
    for (const s of secs) {
      const [tplSection] = await tx
        .insert(sections)
        .values({ listId: tplId, title: s.title, position: s.position })
        .returning({ id: sections.id });
      await tx.update(sections).set({ sourceId: tplSection.id }).where(eq(sections.id, s.id));

      for (const i of s.items) {
        const [tplItem] = await tx
          .insert(items)
          .values({
            sectionId: tplSection.id,
            title: i.title,
            description: i.description,
            position: i.position,
          })
          .returning({ id: items.id });
        await tx.update(items).set({ sourceId: tplItem.id }).where(eq(items.id, i.id));
      }
    }
  });
}

// ---------- Checagens de dono ----------

const ownedSectionIds = (userId: string) =>
  db
    .select({ id: sections.id })
    .from(sections)
    .innerJoin(lists, eq(lists.id, sections.listId))
    .where(eq(lists.userId, userId));

async function findOwnedList(ex: Executor, userId: string, listId: string) {
  const [row] = await ex
    .select({ id: lists.id, kind: lists.kind })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .limit(1);
  return row;
}

async function findOwnedSection(ex: Executor, userId: string, sectionId: string) {
  const [row] = await ex
    .select({ section: sections, kind: lists.kind })
    .from(sections)
    .innerJoin(lists, eq(lists.id, sections.listId))
    .where(and(eq(sections.id, sectionId), eq(lists.userId, userId)))
    .limit(1);
  return row;
}

async function findOwnedItem(ex: Executor, userId: string, itemId: string) {
  const [row] = await ex
    .select({ item: items, section: sections, kind: lists.kind })
    .from(items)
    .innerJoin(sections, eq(sections.id, items.sectionId))
    .innerJoin(lists, eq(lists.id, sections.listId))
    .where(and(eq(items.id, itemId), eq(lists.userId, userId)))
    .limit(1);
  return row;
}

// ---------- Posições ----------

async function nextSectionPosition(ex: Executor, listId: string) {
  const [row] = await ex
    .select({ max: sql<number>`coalesce(max(${sections.position}), 0)::int` })
    .from(sections)
    .where(and(eq(sections.listId, listId), isNull(sections.deletedAt)));
  return row.max + 1;
}

async function nextItemPosition(ex: Executor, sectionId: string) {
  const [row] = await ex
    .select({ max: sql<number>`coalesce(max(${items.position}), 0)::int` })
    .from(items)
    .where(and(eq(items.sectionId, sectionId), isNull(items.deletedAt)));
  return row.max + 1;
}

// ---------- Espelhamento no modelo (mudanças permanentes) ----------

/** Garante que a seção do dia tem um par no modelo e devolve o id desse par. */
async function ensureTemplateSection(tx: Tx, userId: string, daySection: SectionRow) {
  if (daySection.sourceId) {
    const [src] = await tx
      .select({ id: sections.id })
      .from(sections)
      .where(eq(sections.id, daySection.sourceId))
      .limit(1);
    if (src) {
      // Se tinha sido removida do modelo, uma mudança permanente a traz de volta
      await tx.update(sections).set({ deletedAt: null }).where(eq(sections.id, src.id));
      return src.id;
    }
  }
  const tplId = await getTemplateId(tx, userId, true);
  const [created] = await tx
    .insert(sections)
    .values({
      listId: tplId,
      title: daySection.title,
      position: await nextSectionPosition(tx, tplId),
    })
    .returning({ id: sections.id });
  await tx.update(sections).set({ sourceId: created.id }).where(eq(sections.id, daySection.id));
  return created.id;
}

/** Grava (cria ou atualiza) no modelo o par de um item do dia. */
async function upsertTemplateItem(tx: Tx, userId: string, dayItem: ItemRow, daySection: SectionRow) {
  const values = { title: dayItem.title, description: dayItem.description };

  if (dayItem.sourceId) {
    const [src] = await tx
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, dayItem.sourceId))
      .limit(1);
    if (src) {
      await tx
        .update(items)
        .set({ ...values, deletedAt: null })
        .where(eq(items.id, src.id));
      return;
    }
  }

  const tplSectionId = await ensureTemplateSection(tx, userId, daySection);
  const [created] = await tx
    .insert(items)
    .values({
      sectionId: tplSectionId,
      ...values,
      position: await nextItemPosition(tx, tplSectionId),
    })
    .returning({ id: items.id });
  await tx.update(items).set({ sourceId: created.id }).where(eq(items.id, dayItem.id));
}

// ---------- Seções ----------

export async function addSection(userId: string, listId: string, title: string, permanent: boolean) {
  await db.transaction(async (tx) => {
    const list = await findOwnedList(tx, userId, listId);
    if (!list) return;
    const [section] = await tx
      .insert(sections)
      .values({ listId, title, position: await nextSectionPosition(tx, listId) })
      .returning();
    if (permanent && list.kind === "day") await ensureTemplateSection(tx, userId, section);
  });
}

export async function renameSection(
  userId: string,
  sectionId: string,
  title: string,
  permanent: boolean,
) {
  await db.transaction(async (tx) => {
    const owned = await findOwnedSection(tx, userId, sectionId);
    if (!owned) return;
    await tx.update(sections).set({ title }).where(eq(sections.id, sectionId));
    if (permanent && owned.kind === "day") {
      const tplSectionId = await ensureTemplateSection(tx, userId, { ...owned.section, title });
      await tx.update(sections).set({ title }).where(eq(sections.id, tplSectionId));
    }
  });
}

/** Remove (reversível) ou restaura uma seção; com `permanent`, o par do modelo também. */
export async function setSectionDeleted(
  userId: string,
  sectionId: string,
  deleted: boolean,
  permanent: boolean,
) {
  await db.transaction(async (tx) => {
    const owned = await findOwnedSection(tx, userId, sectionId);
    if (!owned) return;
    const deletedAt = deleted ? new Date() : null;
    await tx.update(sections).set({ deletedAt }).where(eq(sections.id, sectionId));
    if (permanent && owned.kind === "day" && owned.section.sourceId) {
      await tx.update(sections).set({ deletedAt }).where(eq(sections.id, owned.section.sourceId));
    }
  });
}

export async function reorderSections(
  userId: string,
  listId: string,
  orderedIds: string[],
  permanent: boolean,
) {
  await db.transaction(async (tx) => {
    const list = await findOwnedList(tx, userId, listId);
    if (!list) return;
    const current = await tx
      .select({ id: sections.id, sourceId: sections.sourceId })
      .from(sections)
      .where(and(eq(sections.listId, listId), isNull(sections.deletedAt)));

    // Só aceita se a lista recebida for exatamente as seções atuais, em outra ordem
    const byId = new Map(current.map((s) => [s.id, s]));
    if (orderedIds.length !== current.length || !orderedIds.every((id) => byId.has(id))) return;
    if (new Set(orderedIds).size !== orderedIds.length) return;

    for (const [index, id] of orderedIds.entries()) {
      await tx.update(sections).set({ position: index + 1 }).where(eq(sections.id, id));
      const sourceId = byId.get(id)?.sourceId;
      if (permanent && list.kind === "day" && sourceId) {
        await tx.update(sections).set({ position: index + 1 }).where(eq(sections.id, sourceId));
      }
    }
  });
}

// ---------- Itens ----------

export async function addItem(userId: string, sectionId: string, title: string, permanent: boolean) {
  await db.transaction(async (tx) => {
    const owned = await findOwnedSection(tx, userId, sectionId);
    if (!owned || owned.section.deletedAt) return;
    const [item] = await tx
      .insert(items)
      .values({ sectionId, title, position: await nextItemPosition(tx, sectionId) })
      .returning();
    if (permanent && owned.kind === "day") await upsertTemplateItem(tx, userId, item, owned.section);
  });
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: { title: string; description: string | null },
  permanent: boolean,
) {
  await db.transaction(async (tx) => {
    const owned = await findOwnedItem(tx, userId, itemId);
    if (!owned) return;
    await tx.update(items).set(data).where(eq(items.id, itemId));
    if (permanent && owned.kind === "day") {
      await upsertTemplateItem(tx, userId, { ...owned.item, ...data }, owned.section);
    }
  });
}

/** Marcar/desmarcar nunca vai para o modelo: é sempre só do dia. */
export async function setItemDone(userId: string, itemId: string, done: boolean) {
  await db
    .update(items)
    .set({ done, doneAt: done ? new Date() : null })
    .where(and(eq(items.id, itemId), inArray(items.sectionId, ownedSectionIds(userId))));
}

/** Remove (reversível) ou restaura um item; com `permanent`, o par do modelo também. */
export async function setItemDeleted(
  userId: string,
  itemId: string,
  deleted: boolean,
  permanent: boolean,
) {
  await db.transaction(async (tx) => {
    const owned = await findOwnedItem(tx, userId, itemId);
    if (!owned) return;
    const deletedAt = deleted ? new Date() : null;
    await tx.update(items).set({ deletedAt }).where(eq(items.id, itemId));
    if (permanent && owned.kind === "day" && owned.item.sourceId) {
      await tx.update(items).set({ deletedAt }).where(eq(items.id, owned.item.sourceId));
    }
  });
}

export async function reorderItems(
  userId: string,
  sectionId: string,
  orderedIds: string[],
  permanent: boolean,
) {
  await db.transaction(async (tx) => {
    const owned = await findOwnedSection(tx, userId, sectionId);
    if (!owned) return;
    const current = await tx
      .select({ id: items.id, sourceId: items.sourceId })
      .from(items)
      .where(and(eq(items.sectionId, sectionId), isNull(items.deletedAt)));

    const byId = new Map(current.map((i) => [i.id, i]));
    if (orderedIds.length !== current.length || !orderedIds.every((id) => byId.has(id))) return;
    if (new Set(orderedIds).size !== orderedIds.length) return;

    for (const [index, id] of orderedIds.entries()) {
      await tx.update(items).set({ position: index + 1 }).where(eq(items.id, id));
      const sourceId = byId.get(id)?.sourceId;
      if (permanent && owned.kind === "day" && sourceId) {
        await tx.update(items).set({ position: index + 1 }).where(eq(items.id, sourceId));
      }
    }
  });
}
