// Lógica PURA do painel "Estrutura" (títulos do arquivo aberto). Sem React, sem banco.

export type OutlineItem = {
  /** 1 = título principal, 2 = subtítulo, 3 = sub-subtítulo... */
  level: number;
  text: string;
  /** Posição no editor para onde o clique pula (o significado depende do editor). */
  pos: number;
};

/**
 * Títulos de um arquivo Markdown: linhas que começam com 1 a 6 "#" seguidos de espaço.
 * Linhas dentro de blocos de código (cercados por três crases ou três til) são ignoradas.
 * `from` é a posição do começo de cada linha no texto inteiro.
 */
export function markdownHeadings(lines: { text: string; from: number }[]): OutlineItem[] {
  const items: OutlineItem[] = [];
  let fence: string | null = null;
  for (const { text, from } of lines) {
    const f = /^\s{0,3}(```|~~~)/.exec(text);
    if (f) {
      if (fence === null) fence = f[1];
      else if (f[1] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(text);
    if (m) items.push({ level: m[1].length, text: m[2], pos: from });
  }
  return items;
}

/** Mesma lista? (evita renderizar de novo a cada tecla quando os títulos não mudaram). */
export function sameOutline(a: OutlineItem[], b: OutlineItem[]): boolean {
  return a.length === b.length && a.every((x, i) => x.level === b[i].level && x.text === b[i].text && x.pos === b[i].pos);
}
