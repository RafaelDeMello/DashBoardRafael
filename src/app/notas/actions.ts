"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifySession } from "@/lib/dal";
import * as notes from "@/lib/notes";
import { MAX_CONTENT } from "@/lib/note-names";
import type { ActionResult } from "@/lib/note-messages";

// Toda ação: 1) confere a sessão, 2) valida a entrada, 3) só então mexe nos dados.
// A checagem "isto é deste usuário?" fica em lib/notes.ts (todas as funções recebem o userId).

const id = z.uuid();
const name = z.string().max(200);
const refresh = () => revalidatePath("/notas", "layout");

const invalid: ActionResult = { ok: false, error: "invalid" };
const fromResult = (r: { ok: true; value?: unknown } | { ok: false; error: string }): ActionResult =>
  r.ok ? { ok: true, id: typeof r.value === "string" ? r.value : undefined } : { ok: false, error: r.error };

// ---------- Repositórios ----------

export type RepoFormState = { error?: string } | undefined;

export async function createRepoAction(_prev: RepoFormState, formData: FormData): Promise<RepoFormState> {
  const user = await verifySession();
  const p = name.safeParse(formData.get("name") ?? "");
  if (!p.success) return { error: "invalid_name" };
  const r = await notes.createRepo(user.id, p.data);
  if (!r.ok) return { error: r.error };
  refresh();
  redirect(`/notas/${r.value}`);
}

export async function renameRepoAction(input: { repoId: string; name: string }): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ repoId: id, name }).safeParse(input);
  if (!p.success) return invalid;
  const r = await notes.renameRepo(user.id, p.data.repoId, p.data.name);
  refresh();
  return fromResult(r);
}

/** Apagar um repositório pede o NOME exato (como no GitHub): conferido aqui, não só na tela. */
export async function deleteRepoAction(input: { repoId: string; confirm: string }): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ repoId: id, confirm: name }).safeParse(input);
  if (!p.success) return invalid;
  const repo = await notes.getRepo(user.id, p.data.repoId);
  if (!repo) return { ok: false, error: "not_found" };
  if (p.data.confirm !== repo.name) return { ok: false, error: "confirm" };
  const r = await notes.deleteRepo(user.id, p.data.repoId);
  refresh();
  return fromResult(r);
}

export async function restoreRepoAction(input: { repoId: string }): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ repoId: id }).safeParse(input);
  if (!p.success) return invalid;
  const r = await notes.restoreRepo(user.id, p.data.repoId);
  refresh();
  return fromResult(r);
}

// ---------- Pastas e arquivos ----------

export async function createNodeAction(input: {
  repoId: string;
  parentId: string | null;
  kind: "folder" | "file";
  name: string;
  icon?: string | null;
}): Promise<ActionResult> {
  const user = await verifySession();
  const p = z
    .object({
      repoId: id,
      parentId: id.nullable(),
      kind: z.enum(["folder", "file"]),
      name,
      icon: z.string().max(30).nullish(),
    })
    .safeParse(input);
  if (!p.success) return invalid;
  const r = await notes.createNode(user.id, p.data.repoId, p.data.parentId, p.data.kind, p.data.name, p.data.icon);
  refresh();
  return fromResult(r);
}

export async function renameNodeAction(input: {
  nodeId: string;
  name: string;
  icon?: string | null;
}): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ nodeId: id, name, icon: z.string().max(30).nullish() }).safeParse(input);
  if (!p.success) return invalid;
  const r = await notes.renameNode(user.id, p.data.nodeId, p.data.name, p.data.icon);
  refresh();
  return fromResult(r);
}

export async function moveNodeAction(input: {
  nodeId: string;
  repoId: string;
  parentId: string | null;
}): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ nodeId: id, repoId: id, parentId: id.nullable() }).safeParse(input);
  if (!p.success) return invalid;
  const r = await notes.moveNode(user.id, p.data.nodeId, p.data.repoId, p.data.parentId);
  refresh();
  return fromResult(r);
}

export async function deleteNodeAction(input: { nodeId: string }): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ nodeId: id }).safeParse(input);
  if (!p.success) return invalid;
  const r = await notes.deleteNode(user.id, p.data.nodeId);
  refresh();
  return fromResult(r);
}

export async function restoreNodeAction(input: { nodeId: string }): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ nodeId: id }).safeParse(input);
  if (!p.success) return invalid;
  const r = await notes.restoreNode(user.id, p.data.nodeId);
  refresh();
  return fromResult(r);
}

/** Salvamento automático do editor. Não revalida a página (senão o texto "pularia" enquanto se digita). */
export async function saveFileAction(input: { nodeId: string; content: string }): Promise<ActionResult> {
  const user = await verifySession();
  const p = z.object({ nodeId: id, content: z.string().max(MAX_CONTENT + 1) }).safeParse(input);
  if (!p.success) return { ok: false, error: "too_large" };
  return fromResult(await notes.saveFile(user.id, p.data.nodeId, p.data.content));
}
