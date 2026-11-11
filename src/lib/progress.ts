// Regras de progresso (puras, sem acesso a banco).

export type DayProgress = { total: number; done: number };

/** Porcentagem de itens feitos (0 quando não há itens). */
export function percent(p?: DayProgress): number {
  if (!p || p.total === 0) return 0;
  return Math.round((p.done / p.total) * 100);
}

/** Nível de cor do calendário: 0 = vazio, 1..4 = mais tarefas feitas. */
export function level(pct: number): 0 | 1 | 2 | 3 | 4 {
  if (pct <= 0) return 0;
  if (pct <= 25) return 1;
  if (pct <= 50) return 2;
  if (pct <= 75) return 3;
  return 4;
}

/** Um dia "conta" para a sequência quando 50% ou mais dos itens foram feitos. */
export const STREAK_MIN_PERCENT = 50;

function previousDay(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Dias seguidos (terminando em `date`) que cumpriram a meta mínima.
 * Se `date` é hoje e hoje ainda não cumpriu, a contagem parte de ontem
 * (o dia ainda está em andamento, não quebra a sequência).
 */
export function streak(
  progress: Record<string, DayProgress>,
  date: string,
  today: string,
): number {
  let d = date;
  if (d === today && percent(progress[d]) < STREAK_MIN_PERCENT) d = previousDay(d);
  let count = 0;
  while (percent(progress[d]) >= STREAK_MIN_PERCENT) {
    count += 1;
    d = previousDay(d);
  }
  return count;
}
