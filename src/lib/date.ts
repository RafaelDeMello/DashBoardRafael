// Datas do app são strings "AAAA-MM-DD" (sem horário), sempre no fuso de São Paulo.
// Assim "hoje" é o mesmo dia para o Rafael mesmo que o servidor (VPS) rode em UTC.
export const TZ = "America/Sao_Paulo";

export function todayISO(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date());
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(value: string, days: number): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Terça, 10 de novembro" */
export function formatTitle(value: string): string {
  const long = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T00:00:00Z`));
  const short = long.replace("-feira", "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** Primeiro e último dia do mês de `value`. */
export function monthBounds(value: string): { start: string; end: string } {
  const [y, m] = value.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { start: `${y}-${mm}-01`, end: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

/** Grade do mês começando na segunda-feira; null = célula vazia. */
export function monthGrid(value: string): { label: string; cells: (string | null)[] } {
  const [y, m] = value.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= last; d++) cells.push(`${y}-${mm}-${String(d).padStart(2, "0")}`);
  const label = `${new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long" })
    .format(first)
    .toUpperCase()} ${y}`;
  return { label, cells };
}

export function formatLong(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T00:00:00Z`));
}
