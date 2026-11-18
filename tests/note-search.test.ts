import { describe, expect, it } from "vitest";
import { escapeLike, extractText, findMatches, textOfNoteContent } from "@/lib/note-search";

describe("extractText (texto puro de uma nota)", () => {
  const doc = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Joins" }] },
      { type: "paragraph", content: [{ type: "text", text: "INNER JOIN: só o que existe" }] },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "usa a chave" }] },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "em comum", marks: [{ type: "bold" }] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Fazer 5 exercícios" }] }],
          },
        ],
      },
    ],
  };

  it("pega só o texto, uma linha por bloco, sem chaves nem nomes de tipo", () => {
    const text = extractText(doc);
    expect(text.split("\n")).toEqual([
      "Joins",
      "INNER JOIN: só o que existe",
      "usa a chave",
      "em comum",
      "Fazer 5 exercícios",
    ]);
    expect(text).not.toContain("paragraph");
    expect(text).not.toContain("bulletList");
  });

  it("aguenta documento vazio, nulo ou com lixo", () => {
    expect(extractText(null)).toBe("");
    expect(extractText({ type: "doc" })).toBe("");
    expect(extractText("texto solto")).toBe("");
    expect(extractText({ type: "doc", content: [{ type: "paragraph" }] })).toBe("");
  });

  it("textOfNoteContent lê o JSON salvo e devolve vazio se for inválido", () => {
    expect(textOfNoteContent(JSON.stringify(doc))).toContain("INNER JOIN");
    expect(textOfNoteContent("não é json")).toBe("");
    expect(textOfNoteContent("")).toBe("");
  });
});

describe("escapeLike", () => {
  const BS = String.fromCharCode(92); // uma barra invertida
  it("tira o poder de curinga de %, _ e da própria barra", () => {
    expect(escapeLike("100%")).toBe(`100${BS}%`);
    expect(escapeLike("a_b")).toBe(`a${BS}_b`);
    expect(escapeLike(`a${BS}b`)).toBe(`a${BS}${BS}b`);
    expect(escapeLike("normal")).toBe("normal");
  });
});

describe("findMatches", () => {
  const text = "primeira linha\nINNER JOIN: só o que existe\nnada aqui\nLEFT join e left JOIN de novo";

  it("acha sem diferenciar maiúsculas, com número da linha e posição do trecho", () => {
    const { matches, total } = findMatches(text, "join");
    expect(total).toBe(3);
    expect(matches.map((m) => m.line)).toEqual([2, 4]);
    for (const m of matches) expect(m.text.slice(m.start, m.end).toLowerCase()).toBe("join");
  });

  it("limita a quantidade de linhas mostradas, mas conta tudo", () => {
    const many = Array.from({ length: 20 }, (_, i) => `linha ${i} com alvo`).join("\n");
    const { matches, total } = findMatches(many, "alvo", 5);
    expect(matches).toHaveLength(5);
    expect(total).toBe(20);
  });

  it("corta linhas longas em volta do trecho", () => {
    const long = `${"x".repeat(200)} alvo ${"y".repeat(200)}`;
    const { matches } = findMatches(long, "alvo");
    expect(matches[0].text.length).toBeLessThan(120);
    expect(matches[0].text.startsWith("…")).toBe(true);
    expect(matches[0].text.slice(matches[0].start, matches[0].end)).toBe("alvo");
  });

  it("sem resultado devolve vazio", () => {
    expect(findMatches(text, "xyz")).toEqual({ matches: [], total: 0 });
  });
});
