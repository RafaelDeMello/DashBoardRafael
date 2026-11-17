import { describe, expect, it } from "vitest";
import {
  addDays,
  dayOfMonth,
  formatTitle,
  formatWeekday,
  isValidISODate,
  monthBounds,
  monthGrid,
} from "@/lib/date";

describe("isValidISODate (entrada vinda da internet)", () => {
  it.each(["2026-03-10", "2024-02-29", "2026-12-31"])("aceita %s", (v) => {
    expect(isValidISODate(v)).toBe(true);
  });

  it.each([
    "",
    "2026-3-10",
    "10/03/2026",
    "2026-13-01",
    "2026-02-30",
    "2025-02-29", // 2025 não é bissexto
    "2026-03-10T00:00:00Z",
    "2026-03-10 ",
    "'; drop table users;--",
    "<script>",
  ])("recusa %j", (v) => {
    expect(isValidISODate(v)).toBe(false);
  });
});

describe("addDays", () => {
  it("atravessa mês, ano e fevereiro bissexto", () => {
    expect(addDays("2026-03-31", 1)).toBe("2026-04-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
  });
});

describe("formatação", () => {
  it("dia da semana sem '-feira' e com inicial maiúscula", () => {
    expect(formatWeekday("2026-11-17")).toBe("Terça");
    expect(formatWeekday("2026-11-14")).toBe("Sábado");
    expect(formatWeekday("2026-11-15")).toBe("Domingo");
  });
  it("título completo", () => {
    expect(formatTitle("2026-11-14")).toBe("Sábado, 14 de novembro");
  });
  it("número do dia sem zero à esquerda", () => {
    expect(dayOfMonth("2026-11-04")).toBe(4);
  });
});

describe("calendário do mês", () => {
  it("limites do mês", () => {
    expect(monthBounds("2026-02-10")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthBounds("2024-02-10")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
  });

  it("novembro de 2026 começa num domingo: seis células vazias antes (semana começa na segunda)", () => {
    const { label, cells } = monthGrid("2026-11-10");
    expect(label).toBe("NOVEMBRO 2026");
    expect(cells.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(cells[6]).toBe("2026-11-01");
    expect(cells.filter(Boolean)).toHaveLength(30);
  });
});
