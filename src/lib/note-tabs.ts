// Lógica PURA das abas de arquivos abertos (sem React, sem banco): fácil de testar.
// Uma aba é só o id do arquivo; o nome e o ícone vêm da árvore, então renomear já reflete na aba.

export const MAX_TABS = 20;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Garante que o arquivo tem aba (no fim). Passando do limite, descarta a aba mais antiga que não seja a dele. */
export function ensureTab(tabs: string[], id: string, max = MAX_TABS): string[] {
  if (tabs.includes(id)) return tabs;
  const next = [...tabs, id];
  while (next.length > max) {
    const drop = next.findIndex((t) => t !== id);
    next.splice(drop, 1);
  }
  return next;
}

/**
 * Fecha uma aba. Se era a aba ativa, `next` diz qual abrir em seguida: a da direita,
 * senão a da esquerda, senão nenhuma (null = voltar para a árvore).
 */
export function closeTab(tabs: string[], id: string, activeId: string | null): { tabs: string[]; next: string | null } {
  const i = tabs.indexOf(id);
  if (i < 0) return { tabs, next: activeId };
  const rest = tabs.filter((t) => t !== id);
  if (id !== activeId) return { tabs: rest, next: activeId };
  return { tabs: rest, next: rest[i] ?? rest[i - 1] ?? null };
}

/** Tira as abas de arquivos que não existem mais (apagados) e repetidas. */
export function reconcile(tabs: string[], validIds: Set<string>): string[] {
  const seen = new Set<string>();
  return tabs.filter((t) => {
    if (!validIds.has(t) || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

/** Lê as abas guardadas no navegador, aceitando só uma lista de ids válidos (o valor pode ter sido mexido à mão). */
export function parseStoredTabs(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is string => typeof x === "string" && UUID.test(x)).slice(0, MAX_TABS);
  } catch {
    return [];
  }
}

export const tabsKey = (repoId: string) => `notas-abas:${repoId}`;
