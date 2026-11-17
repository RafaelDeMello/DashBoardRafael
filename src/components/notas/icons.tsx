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
  Globe,
  Languages,
  Lightbulb,
  Lock,
  Network,
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
};

const PLAIN: Partial<Record<FileIcon, { Icon: LucideIcon; color: string }>> = {
  note: { Icon: StickyNote, color: "#79c0ff" },
  sql: { Icon: Database, color: "#f0a04b" },
  json: { Icon: Braces, color: "#e5b84b" },
  sh: { Icon: Terminal, color: "#4cc38a" },
  md: { Icon: FileText, color: "#9fb6cc" },
  docker: { Icon: Container, color: "#4aa3ff" },
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
          fontSize: Math.round(size * (badge.text.length > 2 ? 0.42 : 0.55)),
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
