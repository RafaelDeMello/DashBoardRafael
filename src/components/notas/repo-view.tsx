"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  FilePlus,
  FolderInput,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  createNodeAction,
  deleteNodeAction,
  moveNodeAction,
  renameNodeAction,
  restoreNodeAction,
} from "@/app/notas/actions";
import { LANGUAGE, fileIcon, fileType } from "@/lib/note-names";
import { NOTE_ERRORS } from "@/lib/note-messages";
import { CodeEditor } from "./code-editor";
import { DarkDialog, ToastBar, darkBtnGhost, type Toast } from "./dlg";
import { FileGlyph, FolderGlyph } from "./icons";
import { NoteEditor } from "./note-editor";
import { PixelFolder } from "./pixel-folder";
import type { SaveStatus } from "./use-autosave";

export type TreeNode = {
  id: string;
  parentId: string | null;
  kind: "folder" | "file";
  name: string;
  icon: string | null;
};
type Props = {
  repo: { id: string; name: string };
  otherRepos: { id: string; name: string }[];
  nodes: TreeNode[];
  file: { id: string; name: string; content: string } | null;
};

const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "Salvo",
  dirty: "Alterado…",
  saving: "Salvando…",
  error: "Erro ao salvar",
};

type Creating = { parentId: string | null; kind: "folder" | "file" } | null;
type Menu = { x: number; y: number; nodeId: string | null } | null;

export function RepoView({ repo, otherRepos, nodes, file }: Props) {
  const router = useRouter();
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const children = useMemo(() => {
    const map = new Map<string | null, TreeNode[]>();
    for (const n of nodes) {
      const list = map.get(n.parentId) ?? [];
      list.push(n);
      map.set(n.parentId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.kind === b.kind ? collator.compare(a.name, b.name) : a.kind === "folder" ? -1 : 1));
    }
    return map;
  }, [nodes]);

  const ancestorsOf = useCallback(
    (id: string) => {
      const out: TreeNode[] = [];
      let cur = byId.get(id)?.parentId ?? null;
      while (cur) {
        const n = byId.get(cur);
        if (!n) break;
        out.unshift(n);
        cur = n.parentId;
      }
      return out;
    },
    [byId],
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const open = new Set<string>();
    if (file) for (const a of ancestorsOf(file.id)) open.add(a.id);
    return open;
  });
  const [activeId, setActiveId] = useState<string | null>(file?.id ?? null);
  const [creating, setCreating] = useState<Creating>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | "root" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const closeToast = useCallback(() => setToast(null), []);

  // Esc fecha o menu de ações
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const fileCount = nodes.filter((n) => n.kind === "file").length;
  const active = activeId ? byId.get(activeId) : undefined;

  const fail = (code: string) => setError(NOTE_ERRORS[code] ?? NOTE_ERRORS.invalid);
  const parentForNew = (): string | null => (active ? (active.kind === "folder" ? active.id : active.parentId) : null);
  const openNode = (id: string) => router.push(`/notas/${repo.id}?f=${id}`);
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const startCreate = (kind: "folder" | "file", parentId?: string | null) => {
    const parent = parentId === undefined ? parentForNew() : parentId;
    if (parent) setExpanded((prev) => new Set(prev).add(parent));
    setError(null);
    setRenaming(null);
    setCreating({ parentId: parent, kind });
  };

  const submitCreate = async (name: string) => {
    if (!creating) return;
    const r = await createNodeAction({ repoId: repo.id, parentId: creating.parentId, kind: creating.kind, name });
    if (!r.ok) return fail(r.error);
    setCreating(null);
    setError(null);
    router.refresh();
    if (r.id) setActiveId(r.id);
    if (creating.kind === "file" && r.id) openNode(r.id);
  };

  const submitRename = async (id: string, name: string) => {
    const node = byId.get(id);
    setRenaming(null);
    if (!node || name.trim() === node.name) return;
    const r = await renameNodeAction({ nodeId: id, name });
    if (!r.ok) return fail(r.error);
    setError(null);
    router.refresh();
  };

  const remove = async (id: string) => {
    const node = byId.get(id);
    if (!node) return;
    const r = await deleteNodeAction({ nodeId: id });
    if (!r.ok) return fail(r.error);
    setError(null);
    if (activeId === id) setActiveId(null);
    // Se o arquivo aberto estava dentro do que foi apagado, volta para a árvore
    if (file && (file.id === id || ancestorsOf(file.id).some((a) => a.id === id))) router.push(`/notas/${repo.id}`);
    setToast({
      
      text: `“${node.name}” apagado`,
      undo: async () => {
        await restoreNodeAction({ nodeId: id });
        router.refresh();
      },
    });
    router.refresh();
  };

  const move = async (id: string, repoId: string, parentId: string | null) => {
    const r = await moveNodeAction({ nodeId: id, repoId, parentId });
    setMoving(null);
    if (!r.ok) return fail(r.error);
    setError(null);
    const target = parentId ? byId.get(parentId)?.name : null;
    setToast({ text: `“${byId.get(id)?.name}” movido${target ? ` para ${target}` : ""}` });
    if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
    router.refresh();
  };

  const isInside = (id: string, ancestorId: string) => id === ancestorId || ancestorsOf(id).some((a) => a.id === ancestorId);

  // ---------- Linhas da árvore ----------

  // Funções de render (não componentes): assim a árvore não é recriada a cada mudança de estado
  const renderRow = (node: TreeNode, depth: number): React.ReactNode => {
    const isFolder = node.kind === "folder";
    const isOpen = expanded.has(node.id);
    // A última linha tocada fica em destaque; sem toque, é o arquivo aberto
    const isSel = activeId ? activeId === node.id : file?.id === node.id;
    const kids = children.get(node.id) ?? [];
    const pad = 6 + depth * 12 + (isFolder ? 0 : 14);

    if (renaming === node.id) {
      return (
        <div key={node.id} style={{ paddingLeft: pad }} className="flex h-[26px] items-center gap-1.5 pr-2">
          {isFolder ? <FolderGlyph name={node.name} icon={node.icon} /> : <FileGlyph name={node.name} />}
          <input
            autoFocus
            defaultValue={node.name}
            maxLength={100}
            aria-label="Novo nome"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => submitRename(node.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(null);
            }}
            className="min-w-0 flex-1 border border-[#19e6ff] bg-[#0f141a] px-1 text-[12.5px] text-[#e6edf3] outline-none max-md:text-base"
          />
        </div>
      );
    }

    return (
      <div key={node.id}>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            setDragId(node.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setDropId(null);
          }}
          onDragOver={(e) => {
            if (!isFolder || !dragId || isInside(node.id, dragId)) return;
            e.preventDefault();
            e.stopPropagation();
            setDropId(node.id);
          }}
          onDrop={(e) => {
            if (!isFolder || !dragId || isInside(node.id, dragId)) return;
            e.preventDefault();
            e.stopPropagation();
            const id = dragId;
            setDragId(null);
            setDropId(null);
            void move(id, repo.id, node.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setActiveId(node.id);
            setMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
          }}
          style={{ paddingLeft: pad }}
          className={`group relative flex h-[26px] cursor-pointer items-center gap-1.5 pr-1 text-[12.5px] max-md:h-[44px] max-md:text-base ${
            dropId === node.id ? "outline outline-1 -outline-offset-1 outline-dashed outline-[#19e6ff] bg-[#16384a]" : ""
          } ${isSel ? "bg-[#2b3544] shadow-[inset_2px_0_0_#19e6ff]" : "hover:bg-[#222a35]"}`}
          onClick={() => {
            setActiveId(node.id);
            if (isFolder) toggle(node.id);
            else openNode(node.id);
          }}
        >
          {Array.from({ length: depth }, (_, i) => (
            <span key={i} aria-hidden className="absolute inset-y-0 w-px bg-[#313843]" style={{ left: 12 + i * 12 }} />
          ))}
          {isFolder ? (
            <>
              {isOpen ? (
                <ChevronDown size={14} className="flex-none text-[#8b949e]" />
              ) : (
                <ChevronRight size={14} className="flex-none text-[#8b949e]" />
              )}
              <FolderGlyph name={node.name} icon={node.icon} open={isOpen} />
            </>
          ) : (
            <FileGlyph name={node.name} />
          )}
          <span className="min-w-0 flex-1 truncate">
            {!isFolder && node.name.endsWith(".nota") ? (
              <>
                {node.name.slice(0, -5)}
                <span className="text-[11px] opacity-50">.nota</span>
              </>
            ) : (
              node.name
            )}
          </span>
          <button
            type="button"
            aria-label={`Ações: ${node.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveId(node.id);
              const r = e.currentTarget.getBoundingClientRect();
              setMenu({ x: r.left, y: r.bottom, nodeId: node.id });
            }}
            className="flex-none p-1 text-[#8b949e] hover:text-white md:opacity-0 md:group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>
        </div>
        {isFolder && isOpen && (
          <>
            {creating?.parentId === node.id && renderCreate(depth + 1)}
            {kids.map((k) => renderRow(k, depth + 1))}
          </>
        )}
      </div>
    );
  };

  const renderCreate = (depth: number) =>
    creating && (
      <CreateRow
        key="criar"
        depth={depth}
        kind={creating.kind}
        onSubmit={(name) => void submitCreate(name)}
        onCancel={() => setCreating(null)}
      />
    );

  // ---------- Menu de ações (botão direito no computador, "⋯" e toque longo no celular) ----------

  const menuNode = menu?.nodeId ? byId.get(menu.nodeId) : undefined;
  const items: { label: string; icon: React.ReactNode; danger?: boolean; run: () => void }[] = [];
  if (menu) {
    const parent = menuNode ? (menuNode.kind === "folder" ? menuNode.id : menuNode.parentId) : null;
    items.push({ label: "Nova nota", icon: <FilePlus size={15} />, run: () => startCreate("file", parent) });
    items.push({ label: "Nova pasta", icon: <FolderPlus size={15} />, run: () => startCreate("folder", parent) });
    if (menuNode) {
      items.push({ label: "Renomear", icon: <Pencil size={15} />, run: () => setRenaming(menuNode.id) });
      items.push({ label: "Mover para…", icon: <FolderInput size={15} />, run: () => setMoving(menuNode.id) });
      items.push({ label: "Apagar", icon: <Trash2 size={15} />, danger: true, run: () => void remove(menuNode.id) });
    }
  }

  const movingNode = moving ? byId.get(moving) : undefined;
  const folderChoices = useMemo(() => {
    if (!movingNode) return [];
    const out: { id: string | null; label: string; depth: number }[] = [{ id: null, label: `Raiz de ${repo.name}`, depth: 0 }];
    const walk = (parent: string | null, depth: number) => {
      for (const n of children.get(parent) ?? []) {
        if (n.kind !== "folder" || n.id === movingNode.id) continue; // não oferece a própria pasta (nem o que está dentro dela)
        out.push({ id: n.id, label: n.name, depth });
        walk(n.id, depth + 1);
      }
    };
    walk(null, 1);
    return out;
  }, [movingNode, children, repo.name]);

  // ---------- Editor ----------

  const crumbs = file ? ancestorsOf(file.id) : [];
  const type = file ? fileType(file.name) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[34px] flex-none items-center gap-2 border-b border-[#2f6a96] bg-[#1b1f27] px-3 text-sm">
        <Link
          href={file ? `/notas/${repo.id}` : "/notas"}
          aria-label={file ? "Voltar para a árvore" : "Voltar para os repositórios"}
          className="text-[#19e6ff] hover:text-white"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="relative h-[16px] w-[20px] flex-none" aria-hidden>
          <span className="absolute left-0 top-0 origin-top-left scale-[0.31]">
            <PixelFolder />
          </span>
        </span>
        <b className="truncate font-medium text-[#e6edf3]">{repo.name}</b>
        <span className="hidden text-xs text-[#6e7a8a] sm:inline">
          · {fileCount} {fileCount === 1 ? "arquivo" : "arquivos"}
        </span>
        <Link href="/notas" className="ml-auto text-xs text-[#8b949e] hover:text-[#19e6ff] max-md:hidden">
          Todos os repositórios
        </Link>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Árvore */}
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.target as HTMLElement).tagName === "INPUT") return;
            const act = (fn: () => void) => {
              e.preventDefault();
              fn();
            };
            if (e.key === "F2") act(() => startCreate("file"));
            else if (e.key === "F3") act(() => startCreate("folder"));
            else if (e.key === "F6" && activeId) act(() => setRenaming(activeId));
            else if (e.key === "Delete" && activeId) act(() => void remove(activeId));
          }}
          className={`flex min-h-0 flex-none flex-col border-r border-[#2f6a96] bg-[#1b1f27] outline-none md:w-[260px] ${
            file ? "max-md:hidden" : "max-md:flex-1"
          }`}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            setDropId("root");
          }}
          onDrop={(e) => {
            if (!dragId) return;
            e.preventDefault();
            const id = dragId;
            setDragId(null);
            setDropId(null);
            void move(id, repo.id, null);
          }}
        >
          <div className="flex h-[26px] flex-none items-center justify-between px-2">
            <span className="font-retro text-[16px] uppercase tracking-[0.2em] text-[#19e6ff]">Arquivos</span>
            <span className="flex gap-2.5 text-[#8b949e]">
              <button type="button" aria-label="Nova nota" title="Nova nota (F2)" onClick={() => startCreate("file")} className="hover:text-white">
                <FilePlus size={15} />
              </button>
              <button type="button" aria-label="Nova pasta" title="Nova pasta (F3)" onClick={() => startCreate("folder")} className="hover:text-white">
                <FolderPlus size={15} />
              </button>
              <button type="button" aria-label="Recolher tudo" title="Recolher tudo" onClick={() => setExpanded(new Set())} className="hover:text-white">
                <ChevronsDownUp size={15} />
              </button>
            </span>
          </div>
          {error && (
            <p role="alert" className="mx-2 mb-1 border border-[#8a3b3b] bg-[#2a1818] px-2 py-1 text-[11px] text-[#f27d7d]">
              {error}
            </p>
          )}
          <div className={`min-h-0 flex-1 overflow-y-auto py-0.5 ${dropId === "root" ? "bg-[#16384a]/40" : ""}`}>
            {creating?.parentId === null && renderCreate(0)}
            {(children.get(null) ?? []).map((n) => renderRow(n, 0))}
            {nodes.length === 0 && !creating && (
              <p className="px-3 py-3 text-xs text-[#8b949e]">
                Vazio. Use os botões acima (ou F2 e F3) para criar a primeira nota ou pasta.
              </p>
            )}
          </div>
          <div className="flex flex-none gap-2 border-t border-[#2a3340] px-2 py-1 font-retro text-[14px] text-[#8aa6bb] max-md:hidden">
            <span><b className="font-normal text-[#19e6ff]">F2</b> Nova</span>
            <span><b className="font-normal text-[#19e6ff]">F3</b> Pasta</span>
            <span><b className="font-normal text-[#19e6ff]">F6</b> Renomear</span>
            <span><b className="font-normal text-[#19e6ff]">Del</b> Apagar</span>
          </div>
          <div className="flex flex-none gap-1.5 border-t border-[#2a3340] bg-[#1b1f27] p-2 md:hidden">
            <button type="button" onClick={() => startCreate("file")} className="flex-1 border border-[#2f6a96] bg-[#16283d] py-2.5 font-retro text-[17px] tracking-[0.06em] text-[#dfe6f5]">
              + Nova
            </button>
            <button type="button" onClick={() => startCreate("folder")} className="flex-1 border border-[#2f6a96] bg-[#16283d] py-2.5 font-retro text-[17px] tracking-[0.06em] text-[#dfe6f5]">
              + Pasta
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className={`min-w-0 flex-1 flex-col bg-[#14181d] ${file ? "flex" : "flex max-md:hidden"}`}>
          {file ? (
            <>
              <div className="flex h-[28px] flex-none items-center border-b border-[#2f6a96] bg-[#1b1f27]">
                <div className="-mt-px flex h-[28px] items-center gap-1.5 border-t-2 border-[#19e6ff] bg-[#14181d] px-3 text-xs text-[#e6edf3]">
                  <FileGlyph name={file.name} />
                  {file.name}
                </div>
              </div>
              <div className="flex flex-none items-center gap-1 overflow-hidden px-3 pt-1.5 text-[11px] text-[#8b949e]">
                {crumbs.map((c) => (
                  <span key={c.id} className="flex items-center gap-1 whitespace-nowrap">
                    <FolderGlyph name={c.name} icon={c.icon} size={13} />
                    {c.name}
                    <ChevronRight size={11} />
                  </span>
                ))}
                <span className="truncate">{file.name}</span>
              </div>
              {type === "note" ? (
                <NoteEditor key={file.id} nodeId={file.id} initial={file.content} onStatus={setSaveStatus} />
              ) : (
                <CodeEditor key={file.id} nodeId={file.id} initial={file.content} onStatus={setSaveStatus} />
              )}
              <div className="flex h-[22px] flex-none items-center justify-between bg-[#16283d] px-3 font-retro text-[15px] uppercase tracking-[0.06em] text-[#9fb6cc]">
                <span>
                  <b className="font-normal text-[#19e6ff]">■</b> {STATUS_TEXT[saveStatus]}
                </span>
                <span>{type === "note" ? "Nota" : (LANGUAGE[fileIcon(file.name)] ?? "Texto")}</span>
              </div>
            </>
          ) : (
            <div className="m-auto max-w-xs p-6 text-center text-sm text-[#6e7a8a]">
              Escolha um arquivo na árvore ou crie uma nota nova.
            </div>
          )}
        </div>
      </div>

      {menu && (
        <>
          <div className="fixed inset-0 z-40 max-md:bg-[#07090d]/60" onClick={() => setMenu(null)} onContextMenu={(e) => (e.preventDefault(), setMenu(null))} />
          <div
            role="menu"
            style={{ left: Math.min(menu.x, typeof window === "undefined" ? menu.x : window.innerWidth - 180), top: menu.y }}
            className="fixed z-50 w-[168px] border border-[#19e6ff] bg-[#1f2530] py-1 text-[13px] shadow-[3px_3px_0_#0b0f14] max-md:!inset-x-0 max-md:!bottom-0 max-md:!top-auto max-md:w-auto max-md:border-x-0 max-md:border-b-0 max-md:border-t-2 max-md:pb-[env(safe-area-inset-bottom)]"
          >
            {menuNode && <div className="hidden truncate border-b border-[#313843] px-3 py-2 text-xs text-[#8b949e] max-md:block">{menuNode.name}</div>}
            {items.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(null);
                  it.run();
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-[#2b3544] max-md:py-3 max-md:text-base ${it.danger ? "text-[#f27d7d]" : "text-[#cdd5df]"}`}
              >
                <span className="text-[#8b949e]">{it.icon}</span>
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}

      {movingNode && (
        <DarkDialog title={`Mover “${movingNode.name}”`} onClose={() => setMoving(null)}>
          <div className="max-h-[50vh] overflow-y-auto">
            {folderChoices.map((c) => (
              <button
                key={c.id ?? "raiz"}
                type="button"
                onClick={() => void move(movingNode.id, repo.id, c.id)}
                style={{ paddingLeft: 8 + c.depth * 14 }}
                className="flex w-full items-center gap-2 py-2 pr-2 text-left text-[13px] hover:bg-[#2b3544]"
              >
                {c.id ? <FolderGlyph name={c.label} icon={byId.get(c.id)?.icon} /> : <PixelFolderSmall />}
                <span className="truncate">{c.label}</span>
              </button>
            ))}
            {otherRepos.length > 0 && <div className="mt-2 border-t border-[#313843] px-2 pb-1 pt-2 text-[11px] uppercase tracking-wide text-[#8b949e]">Outros repositórios</div>}
            {otherRepos.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => void move(movingNode.id, r.id, null)}
                className="flex w-full items-center gap-2 px-2 py-2 text-left text-[13px] hover:bg-[#2b3544]"
              >
                <PixelFolderSmall />
                <span className="truncate">Raiz de {r.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <button type="button" onClick={() => setMoving(null)} className={darkBtnGhost}>
              Cancelar
            </button>
          </div>
        </DarkDialog>
      )}
      <ToastBar toast={toast} onClose={closeToast} />
    </div>
  );
}

function CreateRow({
  depth,
  kind,
  onSubmit,
  onCancel,
}: {
  depth: number;
  kind: "folder" | "file";
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const isFile = kind === "file";
  return (
    <div
      style={{ paddingLeft: 6 + depth * 12 + (isFile ? 14 : 0) }}
      className="flex h-[26px] items-center gap-1.5 pr-2 max-md:h-[44px]"
    >
      {/* O ícone muda enquanto se digita: algoritmos.js ganha o do JavaScript */}
      {isFile ? <FileGlyph name={name || "x.nota"} /> : <FolderGlyph name={name || "x"} />}
      <input
        autoFocus
        value={name}
        maxLength={100}
        onChange={(e) => setName(e.target.value)}
        placeholder={isFile ? "nome.js ou nota" : "Nome da pasta"}
        aria-label={isFile ? "Nome do arquivo" : "Nome da pasta"}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit(name);
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => !name.trim() && onCancel()}
        className="min-w-0 flex-1 border border-[#19e6ff] bg-[#0f141a] px-1 text-[12.5px] text-[#e6edf3] outline-none placeholder:text-[#6e7a8a] max-md:text-base"
      />
    </div>
  );
}

function PixelFolderSmall() {
  return (
    <span className="relative h-[16px] w-[20px] flex-none" aria-hidden>
      <span className="absolute left-0 top-0 origin-top-left scale-[0.31]">
        <PixelFolder />
      </span>
    </span>
  );
}

