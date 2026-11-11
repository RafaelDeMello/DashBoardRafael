import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, lists, sections } from "@/db/schema";
import type { DayProgress } from "@/lib/progress";

// Camada de dados dos dias. REGRA: toda função recebe o userId da sessão e só
// toca em linhas desse usuário (evita que alguém mexa em dados de outra pessoa
// trocando um id na requisição).

export type ItemData = { id: string; title: string; description: string | null; done: boolean };
export type SectionData = { id: string; title: string; items: ItemData[] };
export type DayData = { id: string; date: string; sections: SectionData[] };

export async function getDay(userId: string, date: string): Promise<DayData | null> {
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.userId, userId), eq(lists.kind, "day"), eq(lists.date, date)))
    .limit(1);
  if (!list) return null;

  const secs = await db
    .select()
    .from(sections)
    .where(eq(sections.listId, list.id))
    .orderBy(asc(sections.position));

  const its = secs.length
    ? await db
        .select()
        .from(items)
        .where(
          inArray(
            items.sectionId,
            secs.map((s) => s.id),
          ),
        )
        .orderBy(asc(items.position))
    : [];

  return {
    id: list.id,
    date,
    sections: secs.map((s) => ({
      id: s.id,
      title: s.title,
      items: its
        .filter((i) => i.sectionId === s.id)
        .map((i) => ({ id: i.id, title: i.title, description: i.description, done: i.done })),
    })),
  };
}

/** Data do dia mais recente anterior a `date` (para oferecer "copiar do dia anterior"). */
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
    .leftJoin(sections, eq(sections.listId, lists.id))
    .leftJoin(items, eq(items.sectionId, sections.id))
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

/** Cria o dia. Com copyFromPrevious, copia seções e itens do dia anterior (tudo desmarcado). */
export async function createDay(userId: string, date: string, copyFromPrevious: boolean) {
  await db.transaction(async (tx) => {
    // ON CONFLICT DO NOTHING: se o dia já existe (duplo clique), não faz nada
    const [created] = await tx
      .insert(lists)
      .values({ userId, kind: "day", name: date, date })
      .onConflictDoNothing()
      .returning({ id: lists.id });
    if (!created || !copyFromPrevious) return;

    const [prev] = await tx
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.kind, "day"), lt(lists.date, date)))
      .orderBy(desc(lists.date))
      .limit(1);
    if (!prev) return;

    const secs = await tx
      .select()
      .from(sections)
      .where(eq(sections.listId, prev.id))
      .orderBy(asc(sections.position));

    for (const s of secs) {
      const [copy] = await tx
        .insert(sections)
        .values({ listId: created.id, title: s.title, position: s.position })
        .returning({ id: sections.id });
      const its = await tx
        .select()
        .from(items)
        .where(eq(items.sectionId, s.id))
        .orderBy(asc(items.position));
      if (its.length) {
        await tx.insert(items).values(
          its.map((i) => ({
            sectionId: copy.id,
            title: i.title,
            description: i.description,
            position: i.position,
          })),
        );
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

async function ownsList(userId: string, listId: string) {
  const [row] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .limit(1);
  return !!row;
}

async function ownsSection(userId: string, sectionId: string) {
  const [row] = await db
    .select({ id: sections.id })
    .from(sections)
    .innerJoin(lists, eq(lists.id, sections.listId))
    .where(and(eq(sections.id, sectionId), eq(lists.userId, userId)))
    .limit(1);
  return !!row;
}

// ---------- Alterações ----------

export async function addSection(userId: string, listId: string, title: string) {
  if (!(await ownsList(userId, listId))) return;
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${sections.position}), 0)` })
    .from(sections)
    .where(eq(sections.listId, listId));
  await db.insert(sections).values({ listId, title, position: Number(max) + 1 });
}

export async function deleteSection(userId: string, sectionId: string) {
  if (!(await ownsSection(userId, sectionId))) return;
  await db.delete(sections).where(eq(sections.id, sectionId)); // itens saem junto (cascade)
}

export async function addItem(userId: string, sectionId: string, title: string) {
  if (!(await ownsSection(userId, sectionId))) return;
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${items.position}), 0)` })
    .from(items)
    .where(eq(items.sectionId, sectionId));
  await db.insert(items).values({ sectionId, title, position: Number(max) + 1 });
}

export async function setItemDone(userId: string, itemId: string, done: boolean) {
  await db
    .update(items)
    .set({ done, doneAt: done ? new Date() : null })
    .where(and(eq(items.id, itemId), inArray(items.sectionId, ownedSectionIds(userId))));
}

export async function deleteItem(userId: string, itemId: string) {
  await db
    .delete(items)
    .where(and(eq(items.id, itemId), inArray(items.sectionId, ownedSectionIds(userId))));
}
