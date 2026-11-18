import { describe, expect, it } from "vitest";
import {
  FOLDER_ICONS,
  NAME_MAX,
  fileIcon,
  fileType,
  folderIcon,
  suggestFolderIcon,
  validateName,
  withSuffix,
} from "@/lib/note-names";

describe("validateName", () => {
  it("aceita nomes comuns e tira os espaços das pontas", () => {
    expect(validateName("  algoritmos.js ")).toEqual({ ok: true, value: "algoritmos.js" });
    expect(validateName("Banco de dados")).toEqual({ ok: true, value: "Banco de dados" });
    expect(validateName("Inglês – dia 1")).toMatchObject({ ok: true });
  });

  it.each([
    ["vazio", ""],
    ["só espaços", "   "],
    ["barra", "a/b"],
    ["barra invertida", "a\\b"],
    ["ponto", "."],
    ["dois pontos", ".."],
    ["caractere de controle", "oi\u0000x"],
    ["quebra de linha", "oi\nx"],
    ["grande demais", "a".repeat(NAME_MAX + 1)],
  ])("recusa nome inválido: %s", (_n, value) => {
    expect(validateName(value).ok).toBe(false);
  });

  it("aceita exatamente o tamanho máximo", () => {
    expect(validateName("a".repeat(NAME_MAX)).ok).toBe(true);
  });
});

describe("tipo e ícone do arquivo (pela extensão, como nas IDEs)", () => {
  it.each([
    ["algoritmos.js", "js", "code"],
    ["busca.ts", "ts", "code"],
    ["ordenacao.py", "py", "code"],
    ["consultas.sql", "sql", "code"],
    ["deploy.sh", "sh", "code"],
    ["README.md", "md", "code"],
    ["config.json", "json", "code"],
    ["docker-compose.yml", "docker", "code"],
    ["index.html", "html", "code"],
    ["estilos.css", "css", "code"],
    ["Dockerfile", "docker", "code"],
    ["joins.nota", "note", "note"],
    ["resumo", "note", "note"],
    ["arquivo.xyz", "file", "code"],
    ["APP.JS", "js", "code"],
    [".gitignore", "git", "code"],
    [".gitattributes", "git", "code"],
    [".env", "env", "code"],
    [".env.local", "env", "code"],
    [".dockerignore", "docker", "code"],
    ["docker-compose.yaml", "docker", "code"],
    ["package.json", "npm", "code"],
    ["package-lock.json", "lock", "code"],
    ["yarn.lock", "lock", "code"],
    ["tsconfig.json", "ts", "code"],
    ["LICENSE", "license", "code"],
    ["Makefile", "make", "code"],
    ["App.tsx", "react", "code"],
    ["main.go", "go", "code"],
    ["lib.rs", "rust", "code"],
    ["Main.java", "java", "code"],
    ["index.php", "php", "code"],
    ["dados.csv", "csv", "code"],
    ["config.toml", "toml", "code"],
    ["notas.txt", "txt", "code"],
    [".secreto", "file", "code"],
  ])("%s -> ícone %s, editor %s", (name, icon, type) => {
    expect(fileIcon(name)).toBe(icon);
    expect(fileType(name)).toBe(type);
  });
});

describe("ícone da pasta (sugerido pelo nome)", () => {
  it.each([
    ["Banco de dados", "database"],
    ["db", "database"],
    ["SQL", "database-cog"],
    ["Algoritmos", "algorithms"],
    ["Infra", "server"],
    ["Docker", "docker"],
    ["Redes", "network"],
    ["Inglês", "language"],
    ["Segurança", "lock"],
    ["Ideias soltas", "bulb"],
    [".git", "git"],
    ["Digital", "folder"],
    ["Git e GitHub", "git"],
    ["Qualquer coisa", "folder"],
  ])("%s -> %s", (name, icon) => {
    expect(suggestFolderIcon(name)).toBe(icon);
  });

  it("a escolha da pessoa vale mais que a sugestão, se for um ícone conhecido", () => {
    expect(folderIcon("Banco de dados", "lock")).toBe("lock");
    expect(folderIcon("Banco de dados", "icone-que-nao-existe")).toBe("database");
    expect(folderIcon("Banco de dados", null)).toBe("database");
  });

  it("todos os ícones oferecidos são aceitos", () => {
    for (const icon of FOLDER_ICONS) expect(folderIcon("x", icon)).toBe(icon);
  });
});

describe("withSuffix", () => {
  it("entra antes da extensão e nunca passa do limite", () => {
    expect(withSuffix("a.nota", " (restaurado)")).toBe("a (restaurado).nota");
    expect(withSuffix("Pasta", " (restaurado)")).toBe("Pasta (restaurado)");
    expect(withSuffix(".gitignore", " (restaurado)")).toBe(".gitignore (restaurado)");
    const long = withSuffix("x".repeat(NAME_MAX - 5) + ".nota", " (restaurado)");
    expect(long.length).toBeLessThanOrEqual(NAME_MAX);
    expect(long.endsWith(" (restaurado).nota")).toBe(true);
  });
});
