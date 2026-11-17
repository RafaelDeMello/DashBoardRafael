// Regras de nomes e ícones de Notas. Código PURO (sem banco, sem servidor): roda no servidor
// para validar e no navegador para mostrar o ícone certo enquanto a pessoa digita.

export const NAME_MAX = 100;
export const MAX_DEPTH = 8; // níveis de pasta dentro de um repositório
export const MAX_REPOS = 50;
export const MAX_NODES_PER_REPO = 2000;
export const MAX_CONTENT = 500_000; // caracteres por arquivo

export type NameCheck = { ok: true; value: string } | { ok: false; error: string };

/** Nome de repositório, pasta ou arquivo: sem barras, sem caracteres de controle, 1 a 100 letras. */
export function validateName(raw: string): NameCheck {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Digite um nome." };
  if (value.length > NAME_MAX) return { ok: false, error: `O nome pode ter no máximo ${NAME_MAX} caracteres.` };
  if (/[\\/]/.test(value)) return { ok: false, error: "O nome não pode ter barras." };
  if (/\p{C}/u.test(value)) return { ok: false, error: "O nome tem caracteres inválidos." };
  if (value === "." || value === "..") return { ok: false, error: "Esse nome não é permitido." };
  return { ok: true, value };
}

/** Acrescenta um sufixo ANTES da extensão: "a.nota" + " (restaurado)" = "a (restaurado).nota". */
export function withSuffix(name: string, suffix: string): string {
  const i = name.lastIndexOf(".");
  const out = i > 0 ? name.slice(0, i) + suffix + name.slice(i) : name + suffix;
  if (out.length <= NAME_MAX) return out;
  const cut = out.length - NAME_MAX; // corta o começo do nome, preservando sufixo e extensão
  return i > 0 ? name.slice(0, Math.max(1, i - cut)) + suffix + name.slice(i) : name.slice(0, name.length - cut) + suffix;
}

// ---------- Arquivos ----------

/** "note" = editor de tópicos (JSON); "code" = editor de texto/código. */
export type FileType = "note" | "code";

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function fileType(name: string): FileType {
  const ext = extOf(name);
  if (ext === "nota") return "note";
  if (!ext && !name.startsWith(".") && name !== "Dockerfile") return "note"; // sem extensão = nota
  return "code";
}

export type FileIcon =
  | "note" | "js" | "ts" | "py" | "sql" | "html" | "css" | "json" | "yml" | "sh" | "md" | "docker" | "file";

const EXT_ICON: Record<string, FileIcon> = {
  nota: "note", js: "js", jsx: "js", mjs: "js", ts: "ts", tsx: "ts", py: "py", sql: "sql",
  html: "html", htm: "html", css: "css", json: "json", yml: "yml", yaml: "yml", sh: "sh", bash: "sh", md: "md",
};

export function fileIcon(name: string): FileIcon {
  if (name === "Dockerfile") return "docker";
  const ext = extOf(name);
  if (!ext) return name.startsWith(".") ? "file" : "note";
  return EXT_ICON[ext] ?? "file";
}

/** Nome que aparece na barra de status. */
export const LANGUAGE: Partial<Record<FileIcon, string>> = {
  js: "JavaScript", ts: "TypeScript", py: "Python", sql: "SQL", html: "HTML", css: "CSS",
  json: "JSON", yml: "YAML", sh: "Shell", md: "Markdown", docker: "Dockerfile", file: "Texto",
};

// ---------- Pastas ----------

export const FOLDER_ICONS = [
  "folder", "database", "database-cog", "algorithms", "server", "docker", "network",
  "language", "lock", "cloud", "world", "bulb", "code", "book",
] as const;
export type FolderIcon = (typeof FOLDER_ICONS)[number];

const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const SUGGEST: [RegExp, FolderIcon][] = [
  [/docker|container/, "docker"],
  [/banco|database|\bdb\b|dados/, "database"],
  [/\bsql\b/, "database-cog"],
  [/algoritm|estrutura de dados/, "algorithms"],
  [/infra|servidor|server|devops/, "server"],
  [/rede|network|\bdns\b|\btcp\b/, "network"],
  [/ingles|english|idioma|language/, "language"],
  [/seguranca|security|cripto/, "lock"],
  [/cloud|nuvem|\baws\b|azure/, "cloud"],
  [/\bweb\b|site|frontend|front-end|html|css/, "world"],
  [/ideia|brainstorm/, "bulb"],
  [/codigo|programacao|code/, "code"],
  [/livro|book|leitura/, "book"],
];

/** Ícone sugerido pelo nome da pasta; "folder" quando nada combina. */
export function suggestFolderIcon(name: string): FolderIcon {
  const n = normalize(name);
  for (const [re, icon] of SUGGEST) if (re.test(n)) return icon;
  return "folder";
}

export function isFolderIcon(value: string): value is FolderIcon {
  return (FOLDER_ICONS as readonly string[]).includes(value);
}

/** Ícone final da pasta: o escolhido (se válido) ou o sugerido pelo nome. */
export function folderIcon(name: string, chosen?: string | null): FolderIcon {
  return chosen && isFolderIcon(chosen) ? chosen : suggestFolderIcon(name);
}
