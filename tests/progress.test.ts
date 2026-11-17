import { describe, expect, it } from "vitest";
import { STREAK_MIN_PERCENT, level, percent, streak, type DayProgress } from "@/lib/progress";

const p = (done: number, total: number): DayProgress => ({ done, total });

describe("percent", () => {
  it("é 0 quando não há itens (sem dividir por zero)", () => {
    expect(percent(undefined)).toBe(0);
    expect(percent(p(0, 0))).toBe(0);
  });
  it("arredonda para o inteiro mais próximo", () => {
    expect(percent(p(1, 3))).toBe(33);
    expect(percent(p(2, 3))).toBe(67);
    expect(percent(p(5, 5))).toBe(100);
  });
});

describe("level (cores do calendário)", () => {
  it.each([
    [0, 0],
    [1, 1],
    [25, 1],
    [26, 2],
    [50, 2],
    [51, 3],
    [75, 3],
    [76, 4],
    [100, 4],
  ])("%i%% -> nível %i", (pct, expected) => {
    expect(level(pct)).toBe(expected);
  });
});

describe("streak (dias seguidos)", () => {
  const days = (entries: Record<string, [number, number]>) =>
    Object.fromEntries(Object.entries(entries).map(([d, [done, total]]) => [d, p(done, total)]));

  it("a meta mínima é 50%", () => {
    expect(STREAK_MIN_PERCENT).toBe(50);
  });

  it("conta dias consecutivos que cumpriram a meta, terminando na data", () => {
    const prog = days({ "2026-03-08": [5, 10], "2026-03-09": [8, 10], "2026-03-10": [10, 10] });
    expect(streak(prog, "2026-03-10", "2026-03-10")).toBe(3);
  });

  it("um dia abaixo da meta quebra a sequência", () => {
    const prog = days({ "2026-03-08": [10, 10], "2026-03-09": [1, 10], "2026-03-10": [10, 10] });
    expect(streak(prog, "2026-03-10", "2026-03-10")).toBe(1);
  });

  it("hoje ainda abaixo da meta não quebra: a contagem parte de ontem", () => {
    const prog = days({ "2026-03-08": [10, 10], "2026-03-09": [10, 10], "2026-03-10": [1, 10] });
    expect(streak(prog, "2026-03-10", "2026-03-10")).toBe(2);
  });

  it("um dia passado abaixo da meta zera (só hoje tem a tolerância)", () => {
    const prog = days({ "2026-03-09": [10, 10], "2026-03-10": [1, 10] });
    expect(streak(prog, "2026-03-10", "2026-03-20")).toBe(0);
  });

  it("dia sem lista conta como zero", () => {
    expect(streak({}, "2026-03-10", "2026-03-10")).toBe(0);
  });
});
