// Lógica PURA da busca em Notas (sem banco): extrair o texto de uma nota, achar trechos e montar o padrão LIKE.

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;
export const MAX_FILES = 50; // arquivos por busca
export const MAX_MATCHES_PER_FILE = 5;

/** Texto puro de um documento do editor de notas (JSON do TipTap): um bloco por linha. */
export function extractText(doc: unknown): string {
  const lines: string[] = [];
  let current = "";
  const BLOCKS = new Set(["paragraph", "heading", "listItem", "taskItem", "codeBlock", "blockquote"]);
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (typeof n.text === "string") current += n.text;
    if (n.type === "hardBreak") current += "\n";
    if (Array.isArray(n.content)) for (const child of n.content) walk(child);
    if (n.type && BLOCKS.has(n.type)) {
      lines.push(current);
      current = "";
    }
  };
  walk(doc);
  if (current) lines.push(current);
  return lines
    .join("\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l !== "")
    .join("\n")
    .trim();
}

/** Texto pesquisável de uma nota a partir do conteúdo salvo (JSON); vazio se o JSON for inválido. */
export function textOfNoteContent(content: string): string {
  if (!content) return "";
  try {
    return extractText(JSON.parse(content));
  } catch {
    return "";
  }
}

/** Escapa % _ e \ para usar o texto digitado dentro de um LIKE sem que vire curinga. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export type Match = { line: number; text: string; start: number; end: number };

/**
 * Linhas do texto que contêm a busca (sem diferenciar maiúsculas), com a posição do trecho.
 * O texto da linha é cortado em volta do trecho para caber na lista.
 */
export function findMatches(text: string, query: string, max = MAX_MATCHES_PER_FILE): { matches: Match[]; total: number } {
  const q = query.toLowerCase();
  const matches: Match[] = [];
  let total = 0;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    const at = lower.indexOf(q);
    if (at < 0) continue;
    // conta todas as ocorrências para o contador, mas mostra no máximo uma linha por ocorrência de linha
    let from = 0;
    while (lower.indexOf(q, from) >= 0) {
      total++;
      from = lower.indexOf(q, from) + q.length;
    }
    if (matches.length < max) {
      const line = lines[i];
      const WINDOW = 70;
      const begin = Math.max(0, at - WINDOW / 2);
      const end = Math.min(line.length, at + q.length + WINDOW);
      const prefix = begin > 0 ? "…" : "";
      const suffix = end < line.length ? "…" : "";
      const shown = prefix + line.slice(begin, end).trim() + suffix;
      const offset = shown.toLowerCase().indexOf(q, prefix.length); // a 1ª ocorrência da linha é a que está na janela
      matches.push({ line: i + 1, text: shown, start: offset, end: offset + q.length });
    }
  }
  return { matches, total };
}

export type SearchResult = {
  id: string;
  repoId: string;
  repoName: string;
  name: string;
  /** Pastas até o arquivo (sem o nome do repositório). */
  path: string[];
  nameMatch: boolean;
  matches: Match[];
  /** Total de ocorrências no conteúdo (pode ser maior que matches.length). */
  total: number;
};
