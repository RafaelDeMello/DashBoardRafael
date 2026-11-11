import "server-only";

// Limite de tentativas de login ERRADAS, guardado em memória.
// Serve bem para uma instância só (o caso atual). Se um dia o app rodar em
// vários servidores, trocar por Redis ou por uma tabela no Postgres.

type Entry = { count: number; resetAt: number };

const globalForRl = globalThis as unknown as { rateLimitStore?: Map<string, Entry> };
const store = (globalForRl.rateLimitStore ??= new Map<string, Entry>());

function sweep(now: number) {
  if (store.size < 1000) return;
  for (const [key, entry] of store) if (entry.resetAt <= now) store.delete(key);
}

export function isBlocked(key: string, max: number): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    store.delete(key);
    return false;
  }
  return entry.count >= max;
}

export function registerFailure(key: string, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string) {
  store.delete(key);
}
