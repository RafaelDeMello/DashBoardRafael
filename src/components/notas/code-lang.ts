import { StreamLanguage, type LanguageSupport } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import type { FileIcon } from "@/lib/note-names";

/**
 * Carrega o realce de sintaxe da linguagem do arquivo (pelo ícone, ou seja, pela extensão).
 * Cada linguagem é um pedaço de código separado, baixado só quando um arquivo daquele tipo é aberto.
 */
export async function loadLanguage(icon: FileIcon): Promise<Extension | null> {
  const legacy = (mode: Parameters<typeof StreamLanguage.define>[0]): Extension => StreamLanguage.define(mode);
  switch (icon) {
    case "js":
      return (await import("@codemirror/lang-javascript")).javascript();
    case "react":
      return (await import("@codemirror/lang-javascript")).javascript({ jsx: true, typescript: true });
    case "ts":
      return (await import("@codemirror/lang-javascript")).javascript({ typescript: true });
    case "py":
      return (await import("@codemirror/lang-python")).python();
    case "sql":
      return (await import("@codemirror/lang-sql")).sql();
    case "html":
    case "vue":
      return (await import("@codemirror/lang-html")).html();
    case "css":
      return (await import("@codemirror/lang-css")).css();
    case "json":
    case "npm":
      return (await import("@codemirror/lang-json")).json();
    case "yml":
      return (await import("@codemirror/lang-yaml")).yaml();
    case "md":
      return (await import("@codemirror/lang-markdown")).markdown();
    case "xml":
      return (await import("@codemirror/lang-xml")).xml();
    case "java":
      return (await import("@codemirror/lang-java")).java();
    case "c":
    case "cpp":
      return (await import("@codemirror/lang-cpp")).cpp();
    case "go":
      return (await import("@codemirror/lang-go")).go();
    case "rust":
      return (await import("@codemirror/lang-rust")).rust();
    case "php":
      return (await import("@codemirror/lang-php")).php();
    case "sh":
      return legacy((await import("@codemirror/legacy-modes/mode/shell")).shell);
    case "docker":
      return legacy((await import("@codemirror/legacy-modes/mode/dockerfile")).dockerFile);
    case "toml":
      return legacy((await import("@codemirror/legacy-modes/mode/toml")).toml);
    case "env":
      return legacy((await import("@codemirror/legacy-modes/mode/properties")).properties);
    default:
      return null; // texto simples (git, lock, make, csv, txt...)
  }
}

export type { LanguageSupport };
