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

// Itens e seções também aparecem no editor de Modelos: atualiza as duas telas
const refresh = () => {
  revalidatePath("/");
  revalidatePath("/modelos");
};

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
  refresh();
}

// ---------- Dias (formulários) ----------

export async function createDayAction(formData: FormData) {
  const user = await verifySession();
  const d = date.safeParse(formData.get("date"));
  const mode = z.enum(["empty", "copy", "template"]).safeParse(formData.get("mode"));
  if (!d.success || !mode.success) return;
  // templateId é opcional: sem ele, usa o modelo principal
  const tpl = id.safeParse(formData.get("templateId"));
  await days.createDay(user.id, d.data, mode.data, tpl.success ? tpl.data : undefined);
  refresh();
}

export async function saveAsTemplateAction(formData: FormData) {
  const user = await verifySession();
  const d = date.safeParse(formData.get("date"));
  if (!d.success) return;
  const tpl = id.safeParse(formData.get("templateId"));
  await days.saveDayAsTemplate(user.id, d.data, tpl.success ? tpl.data : undefined);
  refresh();
}

export async function deleteDayAction(formData: FormData) {
  const user = await verifySession();
  const d = date.safeParse(formData.get("date"));
  if (!d.success) return;
  await days.deleteDay(user.id, d.data);
  refresh();
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

  refresh();
  redirect(`/?d=${to.data}`);
}

// ---------- Modelos ----------

const templateName = z.string().trim().min(1).max(100);

export type TemplateFormState = { error?: string } | undefined;

export async function createTemplateAction(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const user = await verifySession();
  const name = templateName.safeParse(formData.get("name"));
  if (!name.success) return { error: "Digite um nome para o modelo." };
  const copy = id.safeParse(formData.get("copyFrom"));
  const created = await days.createTemplate(user.id, name.data, copy.success ? copy.data : undefined);
  if (!created) return { error: "Modelo de origem não encontrado." };
  refresh();
  redirect(`/modelos?m=${created}`);
}

export async function renameTemplate(input: { templateId: string; name: string }) {
  const user = await verifySession();
  const p = z.object({ templateId: id, name: templateName }).safeParse(input);
  if (!p.success) return;
  await days.renameTemplate(user.id, p.data.templateId, p.data.name);
  refresh();
}

export async function deleteTemplateAction(formData: FormData) {
  const user = await verifySession();
  const tpl = id.safeParse(formData.get("templateId"));
  if (!tpl.success) return;
  await days.deleteTemplate(user.id, tpl.data);
  refresh();
  redirect("/modelos");
}

/** "Usar em um dia": cria o dia na data escolhida a partir do modelo e abre esse dia. */
export async function useTemplateOnDayAction(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const user = await verifySession();
  const tpl = id.safeParse(formData.get("templateId"));
  const d = date.safeParse(formData.get("date"));
  if (!tpl.success) return { error: "Modelo inválido." };
  if (!d.success) return { error: "Escolha uma data válida." };
  const created = await days.createDay(user.id, d.data, "template", tpl.data);
  if (!created) return { error: "Esse dia já tem lista. Apague-a antes de usar o modelo." };
  refresh();
  redirect(`/?d=${d.data}`);
}

// ---------- Itens (chamadas diretas da lista interativa) ----------

export async function toggleItem(input: { itemId: string; done: boolean }) {
  const user = await verifySession();
  const p = z.object({ itemId: id, done: z.boolean() }).safeParse(input);
  if (!p.success) return;
  await days.setItemDone(user.id, p.data.itemId, p.data.done);
  refresh();
}

export async function addItem(input: { sectionId: string; title: string; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ sectionId: id, title, permanent }).safeParse(input);
  if (!p.success) return;
  await days.addItem(user.id, p.data.sectionId, p.data.title, p.data.permanent);
  refresh();
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
  refresh();
}

/** deleted=true remove (reversível); deleted=false desfaz a remoção. */
export async function setItemDeleted(input: { itemId: string; deleted: boolean; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ itemId: id, deleted: z.boolean(), permanent }).safeParse(input);
  if (!p.success) return;
  await days.setItemDeleted(user.id, p.data.itemId, p.data.deleted, p.data.permanent);
  refresh();
}

export async function reorderItems(input: { sectionId: string; ids: string[]; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ sectionId: id, ids, permanent }).safeParse(input);
  if (!p.success) return;
  await days.reorderItems(user.id, p.data.sectionId, p.data.ids, p.data.permanent);
  refresh();
}

// ---------- Seções ----------

export async function addSection(input: { listId: string; title: string; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ listId: id, title, permanent }).safeParse(input);
  if (!p.success) return;
  await days.addSection(user.id, p.data.listId, p.data.title, p.data.permanent);
  refresh();
}

export async function renameSection(input: { sectionId: string; title: string; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ sectionId: id, title, permanent }).safeParse(input);
  if (!p.success) return;
  await days.renameSection(user.id, p.data.sectionId, p.data.title, p.data.permanent);
  refresh();
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
  refresh();
}

export async function reorderSections(input: { listId: string; ids: string[]; permanent: boolean }) {
  const user = await verifySession();
  const p = z.object({ listId: id, ids, permanent }).safeParse(input);
  if (!p.success) return;
  await days.reorderSections(user.id, p.data.listId, p.data.ids, p.data.permanent);
  refresh();
}
