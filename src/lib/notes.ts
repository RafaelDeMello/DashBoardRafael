import "server-only";
import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { noteNodes, noteRepos } from "@/db/schema";
import {
  MAX_CONTENT,
  MAX_DEPTH,
  MAX_NODES_PER_REPO,
  MAX_REPOS,
  fileType,
  validateName,
  withSuffix,
} from "@/lib/note-names";
import {
  MAX_FILES,
  SEARCH_MAX,
  SEARCH_MIN,
  escapeLike,
  findMatches,
  textOfNoteContent,
  type SearchResult,
} from "@/lib/note-search";

// Camada de dados de Notas. REGRAS (as mesmas de days.ts):
// 1) Toda função recebe o userId da SESSÃO e só toca em linhas desse usuário.
// 2) "Apagar" é reversível (deleted_at). Tudo que lê filtra deleted_at IS NULL.
// 3) Nada de nomes repetidos na mesma pasta (índice único no banco + checagens aqui).

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = Pick<Tx, "select" | "insert" | "update" | "delete" | "execute">;

export type NoteError =
  | "invalid_name" | "exists" | "limit" | "depth" | "not_found" | "cycle" | "type_change" | "too_large" | "invalid_content";
export type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: NoteError };
const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: NoteError): Result<never> => ({ ok: false, error });

function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}

export type RepoSummary = { id: string; name: string; files: number; updatedAt: Date };
export type NodeData = {
  id: string;
  parentId: string | null;
  kind: "folder" | "file";
  name: string;
  icon: string | null;
};
export type FileData = {
  id: string;
  repoId: string;
  parentId: string | null;
  name: string;
  content: string;
  updatedAt: Date;
};

// ---------- Repositórios ----------

const activeRepo = (userId: string, repoId: string) =>
  and(eq(noteRepos.id, repoId), eq(noteRepos.userId, userId), isNull(noteRepos.deletedAt));

async function findRepo(ex: Executor, userId: string, repoId: string) {
  const [row] = await ex
    .select({ id: noteRepos.id, name: noteRepos.name })
    .from(noteRepos)
    .where(activeRepo(userId, repoId))
    .limit(1);
  return row;
}

export async function listRepos(userId: string): Promise<RepoSummary[]> {
  const repos = await db
    .select({ id: noteRepos.id, name: noteRepos.name, updatedAt: noteRepos.updatedAt })
    .from(noteRepos)
    .where(and(eq(noteRepos.userId, userId), isNull(noteRepos.deletedAt)))
    .orderBy(asc(sql`lower(${noteRepos.name})`), asc(noteRepos.id));
  if (repos.length === 0) return [];

  const counts = await db
    .select({ repoId: noteNodes.repoId, n: sql<number>`count(*)::int` })
    .from(noteNodes)
    .where(and(eq(noteNodes.userId, userId), eq(noteNodes.kind, "file"), isNull(noteNodes.deletedAt)))
    .groupBy(noteNodes.repoId);
  return repos.map((r) => ({ ...r, files: counts.find((c) => c.repoId === r.id)?.n ?? 0 }));
}

export async function getRepo(userId: string, repoId: string) {
  return (await findRepo(db, userId, repoId)) ?? null;
}

export async function createRepo(userId: string, rawName: string): Promise<Result<string>> {
  const name = validateName(rawName);
  if (!name.ok) return fail("invalid_name");
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(noteRepos)
    .where(and(eq(noteRepos.userId, userId), isNull(noteRepos.deletedAt)));
  if (total >= MAX_REPOS) return fail("limit");
  try {
    const [row] = await db
      .insert(noteRepos)
      .values({ userId, name: name.value })
      .returning({ id: noteRepos.id });
    return ok(row.id);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("exists");
    throw e;
  }
}

export async function renameRepo(userId: string, repoId: string, rawName: string): Promise<Result> {
  const name = validateName(rawName);
  if (!name.ok) return fail("invalid_name");
  try {
    const rows = await db
      .update(noteRepos)
      .set({ name: name.value, updatedAt: new Date() })
      .where(activeRepo(userId, repoId))
      .returning({ id: noteRepos.id });
    return rows.length ? ok(undefined) : fail("not_found");
  } catch (e) {
    if (isUniqueViolation(e)) return fail("exists");
    throw e;
  }
}

/** Apaga o repositório inteiro (reversível). */
export async function deleteRepo(userId: string, repoId: string): Promise<Result> {
  const rows = await db
    .update(noteRepos)
    .set({ deletedAt: new Date() })
    .where(activeRepo(userId, repoId))
    .returning({ id: noteRepos.id });
  return rows.length ? ok(undefined) : fail("not_found");
}

export async function restoreRepo(userId: string, repoId: string): Promise<Result> {
  const [repo] = await db
    .select({ name: noteRepos.name })
    .from(noteRepos)
    .where(and(eq(noteRepos.id, repoId), eq(noteRepos.userId, userId)))
    .limit(1);
  if (!repo) return fail("not_found");
  // Se já existe outro repositório com o mesmo nome, volta com " (restaurado)"
  for (let i = 0; i < 5; i++) {
    const name = i === 0 ? repo.name : `${repo.name} (restaurado${i > 1 ? ` ${i}` : ""})`.slice(0, 100);
    try {
      await db
        .update(noteRepos)
        .set({ name, deletedAt: null, updatedAt: new Date() })
        .where(and(eq(noteRepos.id, repoId), eq(noteRepos.userId, userId)));
      return ok(undefined);
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  return fail("exists");
}

// ---------- Árvore ----------

export async function getTree(userId: string, repoId: string): Promise<NodeData[] | null> {
  if (!(await findRepo(db, userId, repoId))) return null;
  return db
    .select({
      id: noteNodes.id,
      parentId: noteNodes.parentId,
      kind: noteNodes.kind,
      name: noteNodes.name,
      icon: noteNodes.icon,
    })
    .from(noteNodes)
    .where(and(eq(noteNodes.repoId, repoId), eq(noteNodes.userId, userId), isNull(noteNodes.deletedAt)));
}

async function findNode(ex: Executor, userId: string, nodeId: string) {
  const [row] = await ex
    .select()
    .from(noteNodes)
    .where(and(eq(noteNodes.id, nodeId), eq(noteNodes.userId, userId), isNull(noteNodes.deletedAt)))
    .limit(1);
  if (!row) return undefined;
  // O repositório também precisa estar ativo
  return (await findRepo(ex, userId, row.repoId)) ? row : undefined;
}

/** Profundidade da pasta (uma pasta na raiz do repositório tem profundidade 1). */
async function folderDepth(ex: Executor, userId: string, folderId: string): Promise<number> {
  const rows = (await ex.execute(sql`
    with recursive a as (
      select id, parent_id, 1 as lvl from note_nodes where id = ${folderId} and user_id = ${userId}
      union all
      select n.id, n.parent_id, a.lvl + 1 from note_nodes n join a on n.id = a.parent_id where n.user_id = ${userId}
    ) select max(lvl)::int as depth from a`)) as unknown as { depth: number }[];
  return rows[0]?.depth ?? 0;
}

/** O nó e todos os que estão dentro dele, com o nível relativo (0 = o próprio nó). */
async function subtree(ex: Executor, userId: string, nodeId: string, onlyActive = true) {
  const filter = onlyActive ? sql`and n.deleted_at is null` : sql``;
  return (await ex.execute(sql`
    with recursive d as (
      select id, 0 as lvl from note_nodes where id = ${nodeId} and user_id = ${userId}
      union all
      select n.id, d.lvl + 1 from note_nodes n join d on n.parent_id = d.id where n.user_id = ${userId} ${filter}
    ) select id, lvl::int as lvl from d`)) as unknown as { id: string; lvl: number }[];
}

export async function createNode(
  userId: string,
  repoId: string,
  parentId: string | null,
  kind: "folder" | "file",
  rawName: string,
  icon?: string | null,
): Promise<Result<string>> {
  const name = validateName(rawName);
  if (!name.ok) return fail("invalid_name");
  if (!(await findRepo(db, userId, repoId))) return fail("not_found");

  if (parentId) {
    const parent = await findNode(db, userId, parentId);
    if (!parent || parent.kind !== "folder" || parent.repoId !== repoId) return fail("not_found");
    if ((await folderDepth(db, userId, parentId)) + 1 > MAX_DEPTH) return fail("depth");
  }
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(noteNodes)
    .where(and(eq(noteNodes.repoId, repoId), eq(noteNodes.userId, userId), isNull(noteNodes.deletedAt)));
  if (total >= MAX_NODES_PER_REPO) return fail("limit");

  try {
    const [row] = await db
      .insert(noteNodes)
      .values({
        userId,
        repoId,
        parentId,
        kind,
        name: name.value,
        icon: kind === "folder" ? (icon ?? null) : null,
        content: kind === "file" ? "" : null,
      })
      .returning({ id: noteNodes.id });
    return ok(row.id);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("exists");
    throw e;
  }
}

export async function renameNode(
  userId: string,
  nodeId: string,
  rawName: string,
  icon?: string | null,
): Promise<Result> {
  const name = validateName(rawName);
  if (!name.ok) return fail("invalid_name");
  const node = await findNode(db, userId, nodeId);
  if (!node) return fail("not_found");
  // Trocar a extensão de um arquivo que já tem texto mudaria o tipo do editor e estragaria o conteúdo
  if (node.kind === "file" && fileType(node.name) !== fileType(name.value) && node.content) {
    return fail("type_change");
  }
  try {
    await db
      .update(noteNodes)
      .set({
        name: name.value,
        ...(node.kind === "folder" && icon !== undefined ? { icon } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(noteNodes.id, nodeId), eq(noteNodes.userId, userId)));
    return ok(undefined);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("exists");
    throw e;
  }
}

/** Move para outra pasta (ou para a raiz, com parentId = null), podendo trocar de repositório. */
export async function moveNode(
  userId: string,
  nodeId: string,
  targetRepoId: string,
  targetParentId: string | null,
): Promise<Result> {
  const node = await findNode(db, userId, nodeId);
  if (!node) return fail("not_found");
  if (!(await findRepo(db, userId, targetRepoId))) return fail("not_found");

  const tree = await subtree(db, userId, nodeId);
  const height = Math.max(...tree.map((r) => r.lvl)); // 0 para arquivo ou pasta vazia

  if (targetParentId) {
    const parent = await findNode(db, userId, targetParentId);
    if (!parent || parent.kind !== "folder" || parent.repoId !== targetRepoId) return fail("not_found");
    // Não pode ir para dentro de si mesma nem de uma subpasta (formaria um ciclo)
    if (tree.some((r) => r.id === targetParentId)) return fail("cycle");
    if ((await folderDepth(db, userId, targetParentId)) + 1 + height > MAX_DEPTH) return fail("depth");
  } else if (1 + height > MAX_DEPTH) {
    return fail("depth");
  }
  if (node.parentId === targetParentId && node.repoId === targetRepoId) return ok(undefined);

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(noteNodes)
        .set({ parentId: targetParentId, repoId: targetRepoId, updatedAt: new Date() })
        .where(and(eq(noteNodes.id, nodeId), eq(noteNodes.userId, userId)));
      if (node.repoId !== targetRepoId) {
        // Tudo que está dentro acompanha o nó para o novo repositório
        for (const r of tree) {
          if (r.id === nodeId) continue;
          await tx
            .update(noteNodes)
            .set({ repoId: targetRepoId })
            .where(and(eq(noteNodes.id, r.id), eq(noteNodes.userId, userId)));
        }
      }
    });
    return ok(undefined);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("exists");
    throw e;
  }
}

/** Apaga (reversível) o nó e tudo que está dentro. Devolve o nó para o "Desfazer". */
export async function deleteNode(userId: string, nodeId: string): Promise<Result> {
  const node = await findNode(db, userId, nodeId);
  if (!node) return fail("not_found");
  const stamp = new Date();
  await db.transaction(async (tx) => {
    for (const r of await subtree(tx, userId, nodeId)) {
      await tx
        .update(noteNodes)
        .set({ deletedAt: stamp })
        .where(and(eq(noteNodes.id, r.id), eq(noteNodes.userId, userId)));
    }
  });
  return ok(undefined);
}

/** Desfaz a exclusão: devolve o nó e o que foi apagado junto com ele (mesmo instante). */
export async function restoreNode(userId: string, nodeId: string): Promise<Result> {
  const [node] = await db
    .select()
    .from(noteNodes)
    .where(and(eq(noteNodes.id, nodeId), eq(noteNodes.userId, userId)))
    .limit(1);
  if (!node || !node.deletedAt) return fail("not_found");
  if (!(await findRepo(db, userId, node.repoId))) return fail("not_found");

  // Se a pasta de origem também foi apagada, o nó volta para a raiz do repositório
  let parentId = node.parentId;
  if (parentId && !(await findNode(db, userId, parentId))) parentId = null;

  const stamp = node.deletedAt;
  const members = (await subtree(db, userId, nodeId, false)).filter((r) => r.id !== nodeId);
  for (let i = 0; i < 5; i++) {
    const name = i === 0 ? node.name : withSuffix(node.name, ` (restaurado${i > 1 ? ` ${i}` : ""})`);
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(noteNodes)
          .set({ name, parentId, deletedAt: null, updatedAt: new Date() })
          .where(and(eq(noteNodes.id, nodeId), eq(noteNodes.userId, userId)));
        for (const m of members) {
          await tx
            .update(noteNodes)
            .set({ deletedAt: null })
            .where(
              and(eq(noteNodes.id, m.id), eq(noteNodes.userId, userId), eq(noteNodes.deletedAt, stamp)),
            );
        }
      });
      return ok(undefined);
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  return fail("exists");
}

// ---------- Arquivos ----------

export async function getFile(userId: string, nodeId: string): Promise<FileData | null> {
  const node = await findNode(db, userId, nodeId);
  if (!node || node.kind !== "file") return null;
  return {
    id: node.id,
    repoId: node.repoId,
    parentId: node.parentId,
    name: node.name,
    content: node.content ?? "",
    updatedAt: node.updatedAt,
  };
}

export async function saveFile(userId: string, nodeId: string, content: string): Promise<Result> {
  if (content.length > MAX_CONTENT) return fail("too_large");
  const node = await findNode(db, userId, nodeId);
  if (!node || node.kind !== "file") return fail("not_found");
  if (fileType(node.name) === "note" && content !== "") {
    try {
      const doc = JSON.parse(content) as { type?: unknown };
      if (doc?.type !== "doc") return fail("invalid_content");
    } catch {
      return fail("invalid_content");
    }
  }
  await db
    .update(noteNodes)
    // Nota: guarda também o texto puro (sem a estrutura JSON) para a busca
    .set({
      content,
      searchText: fileType(node.name) === "note" ? textOfNoteContent(content) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(noteNodes.id, nodeId), eq(noteNodes.userId, userId)));
  return ok(undefined);
}

// ---------- Busca ----------

/**
 * Procura (sem diferenciar maiúsculas) no NOME e no CONTEÚDO dos arquivos do usuário.
 * Com `repoId`, só nesse repositório; sem ele, em todos. Só arquivos e repositórios não apagados.
 */
export async function searchNotes(
  userId: string,
  rawQuery: string,
  repoId: string | null,
): Promise<{ results: SearchResult[]; truncated: boolean }> {
  const query = rawQuery.trim();
  if (query.length < SEARCH_MIN || query.length > SEARCH_MAX) return { results: [], truncated: false };
  if (repoId && !(await findRepo(db, userId, repoId))) return { results: [], truncated: false };

  const like = `%${escapeLike(query)}%`;
  const rows = await db
    .select({
      id: noteNodes.id,
      repoId: noteNodes.repoId,
      parentId: noteNodes.parentId,
      name: noteNodes.name,
      content: noteNodes.content,
      searchText: noteNodes.searchText,
      repoName: noteRepos.name,
    })
    .from(noteNodes)
    .innerJoin(noteRepos, eq(noteRepos.id, noteNodes.repoId))
    .where(
      and(
        eq(noteNodes.userId, userId),
        eq(noteRepos.userId, userId),
        isNull(noteNodes.deletedAt),
        isNull(noteRepos.deletedAt),
        eq(noteNodes.kind, "file"),
        repoId ? eq(noteNodes.repoId, repoId) : undefined,
        or(
          sql`${noteNodes.name} ilike ${like}`,
          sql`${noteNodes.searchText} ilike ${like}`,
          // notas salvas antes da busca existir ainda não têm o texto puro: olha o JSON (o filtro fino é feito abaixo)
          and(isNull(noteNodes.searchText), sql`${noteNodes.content} ilike ${like}`),
        ),
      ),
    )
    .orderBy(asc(sql`lower(${noteRepos.name})`), asc(sql`lower(${noteNodes.name})`), asc(noteNodes.id))
    .limit(MAX_FILES + 1);

  const truncated = rows.length > MAX_FILES;
  const kept = rows.slice(0, MAX_FILES);

  // Caminho das pastas até cada arquivo (sobe de nível em nível, no máximo 8 vezes)
  const names = new Map<string, { parentId: string | null; name: string }>();
  let pending = [...new Set(kept.map((r) => r.parentId).filter((p): p is string => !!p))];
  for (let i = 0; i < MAX_DEPTH && pending.length; i++) {
    const folders = await db
      .select({ id: noteNodes.id, parentId: noteNodes.parentId, name: noteNodes.name })
      .from(noteNodes)
      .where(and(eq(noteNodes.userId, userId), inArray(noteNodes.id, pending)));
    pending = [];
    for (const f of folders) {
      names.set(f.id, { parentId: f.parentId, name: f.name });
      if (f.parentId && !names.has(f.parentId)) pending.push(f.parentId);
    }
  }
  const pathOf = (parentId: string | null) => {
    const out: string[] = [];
    let cur = parentId;
    while (cur && names.has(cur)) {
      out.unshift(names.get(cur)!.name);
      cur = names.get(cur)!.parentId;
    }
    return out;
  };

  const results: SearchResult[] = [];
  for (const r of kept) {
    const isNote = fileType(r.name) === "note";
    const text = r.searchText ?? (isNote ? textOfNoteContent(r.content ?? "") : (r.content ?? ""));
    const { matches, total } = findMatches(text, query);
    const nameMatch = r.name.toLowerCase().includes(query.toLowerCase());
    if (!nameMatch && total === 0) continue; // falso positivo do filtro grosseiro (ex.: chave do JSON)
    results.push({
      id: r.id,
      repoId: r.repoId,
      repoName: r.repoName,
      name: r.name,
      path: pathOf(r.parentId),
      nameMatch,
      matches,
      total,
    });
  }
  return { results, truncated };
}
