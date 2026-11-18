import { describe, expect, it } from "vitest";
import { markdownHeadings, sameOutline, type OutlineItem } from "@/lib/note-outline";

const toLines = (text: string) => {
  let from = 0;
  return text.split("\n").map((t) => {
    const line = { text: t, from };
    from += t.length + 1;
    return line;
  });
};

describe("markdownHeadings", () => {
  it("acha títulos de 1 a 6 # com o nível e a posição da linha", () => {
    const md = "# Título\ntexto\n## Sub\n### Sub-sub\n###### Fundo";
    const items = markdownHeadings(toLines(md));
    expect(items.map((i) => [i.level, i.text])).toEqual([
      [1, "Título"],
      [2, "Sub"],
      [3, "Sub-sub"],
      [6, "Fundo"],
    ]);
    expect(items[1].pos).toBe(md.indexOf("## Sub"));
  });

  it("ignora o que não é título: sem espaço, sete #, dentro de bloco de código", () => {
    const md = ["#semespaco", "####### sete", "```", "# comentario no codigo", "```", "~~~", "## outro", "~~~", "# real"].join("\n");
    expect(markdownHeadings(toLines(md)).map((i) => i.text)).toEqual(["real"]);
  });

  it("tira os # de fechamento e os espaços do fim", () => {
    expect(markdownHeadings(toLines("## Título ##  ")).map((i) => i.text)).toEqual(["Título"]);
  });

  it("texto sem títulos devolve lista vazia", () => {
    expect(markdownHeadings(toLines("só texto\nsem título"))).toEqual([]);
  });
});

describe("sameOutline", () => {
  const a: OutlineItem[] = [{ level: 1, text: "A", pos: 0 }];
  it("compara nível, texto e posição", () => {
    expect(sameOutline(a, [{ level: 1, text: "A", pos: 0 }])).toBe(true);
    expect(sameOutline(a, [{ level: 2, text: "A", pos: 0 }])).toBe(false);
    expect(sameOutline(a, [{ level: 1, text: "B", pos: 0 }])).toBe(false);
    expect(sameOutline(a, [{ level: 1, text: "A", pos: 5 }])).toBe(false);
    expect(sameOutline(a, [])).toBe(false);
  });
});
