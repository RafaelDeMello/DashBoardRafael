"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { isValidISODate } from "@/lib/date";
import { verifySession } from "@/lib/dal";
import * as days from "@/lib/days";

// Toda action: 1) confere a sessão, 2) valida a entrada, 3) só então mexe nos dados.
// Entrada inválida é ignorada em silêncio (a interface já impede esses casos).

const id = z.uuid();
const title = z.string().trim().min(1).max(200);
const date = z.string().refine(isValidISODate);

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

export async function createDayAction(formData: FormData) {
  const user = await verifySession();
  const d = date.safeParse(formData.get("date"));
  if (!d.success) return;
  await days.createDay(user.id, d.data, formData.get("mode") === "copy");
  revalidatePath("/");
}

export async function addSectionAction(formData: FormData) {
  const user = await verifySession();
  const listId = id.safeParse(formData.get("listId"));
  const t = title.safeParse(formData.get("title"));
  if (!listId.success || !t.success) return;
  await days.addSection(user.id, listId.data, t.data);
  revalidatePath("/");
}

export async function deleteSectionAction(formData: FormData) {
  const user = await verifySession();
  const sectionId = id.safeParse(formData.get("sectionId"));
  if (!sectionId.success) return;
  await days.deleteSection(user.id, sectionId.data);
  revalidatePath("/");
}

export async function addItemAction(formData: FormData) {
  const user = await verifySession();
  const sectionId = id.safeParse(formData.get("sectionId"));
  const t = title.safeParse(formData.get("title"));
  if (!sectionId.success || !t.success) return;
  await days.addItem(user.id, sectionId.data, t.data);
  revalidatePath("/");
}

export async function toggleItemAction(formData: FormData) {
  const user = await verifySession();
  const itemId = id.safeParse(formData.get("itemId"));
  if (!itemId.success) return;
  await days.setItemDone(user.id, itemId.data, formData.get("done") === "true");
  revalidatePath("/");
}

export async function deleteItemAction(formData: FormData) {
  const user = await verifySession();
  const itemId = id.safeParse(formData.get("itemId"));
  if (!itemId.success) return;
  await days.deleteItem(user.id, itemId.data);
  revalidatePath("/");
}
