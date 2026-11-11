"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidISODate } from "@/lib/date";
import { verifySession } from "@/lib/dal";
import * as days from "@/lib/days";

// Toda action: 1) confere a sessão, 2) valida a entrada, 3) só então mexe nos dados.
// A checagem "este dado é deste usuário?" fica na camada de dados (lib/days.ts).
// Entrada inválida é ignorada em silêncio (a interface já impede esses casos).

const id = z.uuid();
const title = z.string().trim().min(1).max(200);
const description = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .nullable();
const date = z.string().refine(isValidISODate);
const permanent = z.boolean();
const ids = z.array(id).max(500);

// ---------- Preferências ----------

/** Lembra se o menu lateral está expandido (cookie, lido no servidor: sem "piscar"). */
export async function setMenuAction(formData: FormData) {
  await verifySession();
  const expanded = formData.get("expanded") === "true";
  (await cookies()).set("menu", expanded ? "expanded" : "collapsed", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/");
}

// ---------- Dias (formulários) ----------

export async function createDayAction(formData: FormData) {
  const user = await verifySession();
  const d = date.safeParse(formData.get("date"));
  const mode = z.enum(["empty", "copy", "template"]).safeParse(formData.get("mode"));
  if (!d.success || !mode.success) return;
  await days.createDay(user.id, d.data, mode.data);
  revalidatePath("/");
}

export async function saveAsTemplateAction(formData: FormData) {
  const user = await verifySession();
  const d = date.safeParse(formData.get("date"));
  if (!d.success) return;
  await days.saveDayAsTemplate(user.id, d.data);
  revalidatePath("/");
}

export async function deleteDayAction(formData: FormData) {
  const user = await verifySession();
  const d = date.safeParse(formData.get("date"));
  if (!d.success) return;
  await days.deleteDay(user.id, d.data);
  revalidatePath("/");
}

export type CopyDayState = { error?: string } | undefined;

export async function copyDayAction(_prev: CopyDayState, formData: FormData): Promise<CopyDayState> {
  const user = await verifySession();
  const from = date.safeParse(formData.get("from"));
  const to = date.safeParse(formData.get("to"));
  if (!from.success || !to.success) return { error: "Escolha uma data válida." };
  if (from.data === to.data) return { error: "Escolha uma data diferente deste dia." };

  const result = await days.copyDayTo(user.id, from.data, to.data);
  if (result === "exists") return { error: "Esse dia já tem lista. Apague-a antes de copiar." };
  if (result === "missing") return { error: "O dia de origem não existe mais." };

  revalidatePath("/");
  redirect(`/?d=${to.data}`);
}

// ---------- Itens (chamadas diretas da lista interativa) ----------

export async function toggleItem(input: { itemId: string; done: boolean }) {
  const user = await verifySession();
  const p = z.object({ itemId: id, done: z.boolean() }).safeParse(input);
  if (!p.success) return;
  await days.setItemDone(user.id, p.data.itemId, p.data.done);
  revalidatePath("/");
}

export async function addItem(input: { sectionId: string; title: string; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ sectionId: id, title, permanent }).safeParse(input);
  if (!p.success) return;
  await days.addItem(user.id, p.data.sectionId, p.data.title, p.data.permanent);
  revalidatePath("/");
}

export async function updateItem(input: {
  itemId: string;
  title: string;
  description: string | null;
  permanent: boolean;
}) {
  const user = await verifySession();
  const p = z.object({ itemId: id, title, description, permanent }).safeParse(input);
  if (!p.success) return;
  await days.updateItem(
    user.id,
    p.data.itemId,
    { title: p.data.title, description: p.data.description },
    p.data.permanent,
  );
  revalidatePath("/");
}

/** deleted=true remove (reversível); deleted=false desfaz a remoção. */
export async function setItemDeleted(input: { itemId: string; deleted: boolean; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ itemId: id, deleted: z.boolean(), permanent }).safeParse(input);
  if (!p.success) return;
  await days.setItemDeleted(user.id, p.data.itemId, p.data.deleted, p.data.permanent);
  revalidatePath("/");
}

export async function reorderItems(input: { sectionId: string; ids: string[]; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ sectionId: id, ids, permanent }).safeParse(input);
  if (!p.success) return;
  await days.reorderItems(user.id, p.data.sectionId, p.data.ids, p.data.permanent);
  revalidatePath("/");
}

// ---------- Seções ----------

export async function addSection(input: { listId: string; title: string; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ listId: id, title, permanent }).safeParse(input);
  if (!p.success) return;
  await days.addSection(user.id, p.data.listId, p.data.title, p.data.permanent);
  revalidatePath("/");
}

export async function renameSection(input: { sectionId: string; title: string; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ sectionId: id, title, permanent }).safeParse(input);
  if (!p.success) return;
  await days.renameSection(user.id, p.data.sectionId, p.data.title, p.data.permanent);
  revalidatePath("/");
}

export async function setSectionDeleted(input: {
  sectionId: string;
  deleted: boolean;
  permanent: boolean;
}) {
  const user = await verifySession();
  const p = z.object({ sectionId: id, deleted: z.boolean(), permanent }).safeParse(input);
  if (!p.success) return;
  await days.setSectionDeleted(user.id, p.data.sectionId, p.data.deleted, p.data.permanent);
  revalidatePath("/");
}

export async function reorderSections(input: { listId: string; ids: string[]; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ listId: id, ids, permanent }).safeParse(input);
  if (!p.success) return;
  await days.reorderSections(user.id, p.data.listId, p.data.ids, p.data.permanent);
  revalidatePath("/");
}
