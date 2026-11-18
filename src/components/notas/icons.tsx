import {
  BookOpen,
  Braces,
  Cloud,
  Code,
  Container,
  Database,
  DatabaseZap,
  File,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Globe,
  KeyRound,
  Languages,
  Lightbulb,
  Lock,
  Network,
  Atom,
  Scale,
  Settings,
  Table,
  Wrench,
  Binary,
  Server,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { fileIcon, folderIcon, type FileIcon, type FolderIcon } from "@/lib/note-names";

// Ícones de Notas, no estilo das IDEs: cada arquivo tem o ícone da sua extensão e cada pasta o do seu assunto.

const FOLDER: Record<FolderIcon, { Icon: LucideIcon; color: string }> = {
  folder: { Icon: Folder, color: "#d8b45a" },
  database: { Icon: Database, color: "#f0a04b" },
  "database-cog": { Icon: DatabaseZap, color: "#5aa9ff" },
  algorithms: { Icon: Binary, color: "#b48cf2" },
  server: { Icon: Server, color: "#4cc38a" },
  docker: { Icon: Container, color: "#4aa3ff" },
  network: { Icon: Network, color: "#e5b84b" },
  language: { Icon: Languages, color: "#f27d7d" },
  lock: { Icon: Lock, color: "#e08cb0" },
  cloud: { Icon: Cloud, color: "#4aa3ff" },
  world: { Icon: Globe, color: "#e8794a" },
  bulb: { Icon: Lightbulb, color: "#ffe08a" },
  code: { Icon: Code, color: "#5aa9ff" },
  book: { Icon: BookOpen, color: "#c9a227" },
  git: { Icon: GitBranch, color: "#f05033" },
};

export function FolderGlyph({
  name,
  icon,
  open,
  size = 15,
}: {
  name: string;
  icon?: string | null;
  open?: boolean;
  size?: number;
}) {
  const key = folderIcon(name, icon);
  const { Icon, color } = FOLDER[key];
  const Shown = key === "folder" && open ? FolderOpen : Icon;
  return <Shown size={size} style={{ color }} className="flex-none" aria-hidden />;
}

// Linguagens com "selo" de letras (como os ícones de arquivo do VS Code)
const BADGE: Partial<Record<FileIcon, { text: string; bg: string; fg: string }>> = {
  js: { text: "JS", bg: "#f7df1e", fg: "#1a1a18" },
  ts: { text: "TS", bg: "#3d8fe0", fg: "#ffffff" },
  py: { text: "PY", bg: "#4b8bbe", fg: "#ffe873" },
  html: { text: "<>", bg: "#e8794a", fg: "#ffffff" },
  css: { text: "#", bg: "#2f8bd8", fg: "#ffffff" },
  yml: { text: "YML", bg: "#d96b6b", fg: "#ffffff" },
  npm: { text: "npm", bg: "#cb3837", fg: "#ffffff" },
  java: { text: "JV", bg: "#e76f00", fg: "#ffffff" },
  c: { text: "C", bg: "#5c6bc0", fg: "#ffffff" },
  cpp: { text: "C++", bg: "#00599c", fg: "#ffffff" },
  go: { text: "GO", bg: "#00add8", fg: "#ffffff" },
  rust: { text: "RS", bg: "#b7410e", fg: "#ffffff" },
  php: { text: "PHP", bg: "#777bb3", fg: "#ffffff" },
  vue: { text: "V", bg: "#41b883", fg: "#1a1a18" },
  xml: { text: "</>", bg: "#8a6fd0", fg: "#ffffff" },
};

const PLAIN: Partial<Record<FileIcon, { Icon: LucideIcon; color: string }>> = {
  note: { Icon: StickyNote, color: "#79c0ff" },
  sql: { Icon: Database, color: "#f0a04b" },
  json: { Icon: Braces, color: "#e5b84b" },
  sh: { Icon: Terminal, color: "#4cc38a" },
  md: { Icon: FileText, color: "#9fb6cc" },
  docker: { Icon: Container, color: "#4aa3ff" },
  react: { Icon: Atom, color: "#61dafb" },
  git: { Icon: GitBranch, color: "#f05033" },
  env: { Icon: KeyRound, color: "#e5b84b" },
  lock: { Icon: Lock, color: "#8b949e" },
  license: { Icon: Scale, color: "#c9a227" },
  make: { Icon: Wrench, color: "#9fb6cc" },
  toml: { Icon: Settings, color: "#9fb6cc" },
  csv: { Icon: Table, color: "#4cc38a" },
  txt: { Icon: FileText, color: "#8b949e" },
  file: { Icon: File, color: "#8b949e" },
};

export function FileGlyph({ name, size = 15 }: { name: string; size?: number }) {
  const key = fileIcon(name);
  const badge = BADGE[key];
  if (badge) {
    return (
      <span
        aria-hidden
        className="inline-flex flex-none items-center justify-center font-mono font-bold leading-none"
        style={{
          width: size,
          height: size,
          background: badge.bg,
          color: badge.fg,
          fontSize: Math.round(size * (badge.text.length > 2 ? 0.4 : 0.55)),
          borderRadius: 2,
        }}
      >
        {badge.text}
      </span>
    );
  }
  const { Icon, color } = PLAIN[key] ?? PLAIN.file!;
  return <Icon size={size} style={{ color }} className="flex-none" aria-hidden />;
}
