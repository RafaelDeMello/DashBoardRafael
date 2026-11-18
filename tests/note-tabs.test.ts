import { describe, expect, it } from "vitest";
import { MAX_TABS, closeTab, ensureTab, parseStoredTabs, reconcile } from "@/lib/note-tabs";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("ensureTab", () => {
  it("acrescenta no fim e não repete", () => {
    expect(ensureTab([id(1)], id(2))).toEqual([id(1), id(2)]);
    expect(ensureTab([id(1), id(2)], id(1))).toEqual([id(1), id(2)]);
  });

  it("passando do limite, descarta a mais antiga e mantém a nova", () => {
    const full = Array.from({ length: MAX_TABS }, (_, i) => id(i));
    const next = ensureTab(full, id(99));
    expect(next).toHaveLength(MAX_TABS);
    expect(next[0]).toBe(id(1));
    expect(next[next.length - 1]).toBe(id(99));
  });
});

describe("closeTab", () => {
  const tabs = [id(1), id(2), id(3)];

  it("fechar uma aba que não é a ativa mantém a ativa", () => {
    expect(closeTab(tabs, id(1), id(2))).toEqual({ tabs: [id(2), id(3)], next: id(2) });
  });

  it("fechar a ativa abre a da direita; sem direita, a da esquerda", () => {
    expect(closeTab(tabs, id(2), id(2))).toEqual({ tabs: [id(1), id(3)], next: id(3) });
    expect(closeTab(tabs, id(3), id(3))).toEqual({ tabs: [id(1), id(2)], next: id(2) });
  });

  it("fechar a última aba aberta volta para a árvore (next = null)", () => {
    expect(closeTab([id(1)], id(1), id(1))).toEqual({ tabs: [], next: null });
  });

  it("fechar algo que nem está aberto não muda nada", () => {
    expect(closeTab(tabs, id(9), id(2))).toEqual({ tabs, next: id(2) });
  });
});

describe("reconcile", () => {
  it("tira abas de arquivos apagados e repetidas, mantendo a ordem", () => {
    const valid = new Set([id(1), id(3)]);
    expect(reconcile([id(3), id(2), id(1), id(3)], valid)).toEqual([id(3), id(1)]);
  });
});

describe("parseStoredTabs", () => {
  it("lê uma lista de ids válidos", () => {
    expect(parseStoredTabs(JSON.stringify([id(1), id(2)]))).toEqual([id(1), id(2)]);
  });

  it("ignora lixo, valores que não são ids e JSON quebrado", () => {
    expect(parseStoredTabs(null)).toEqual([]);
    expect(parseStoredTabs("não é json")).toEqual([]);
    expect(parseStoredTabs(JSON.stringify({ a: 1 }))).toEqual([]);
    expect(parseStoredTabs(JSON.stringify([id(1), "<script>alert(1)</script>", 5, null, "../../etc"]))).toEqual([id(1)]);
  });

  it("não aceita mais abas que o limite", () => {
    const many = Array.from({ length: MAX_TABS + 10 }, (_, i) => id(i));
    expect(parseStoredTabs(JSON.stringify(many))).toHaveLength(MAX_TABS);
  });
});
