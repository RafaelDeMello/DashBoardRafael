"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import type { OutlineItem } from "@/lib/note-outline";
import { useAutosave, type SaveStatus } from "./use-autosave";

function parse(content: string) {
  if (!content) return undefined;
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

const btn =
  "border border-[#2f6a96] bg-[#1b1f27] px-2 text-[11px] leading-5 text-[#9fb6cc] hover:border-[#19e6ff] hover:text-[#19e6ff] max-md:flex-1 max-md:py-2 max-md:text-sm";

/** Editor de notas de tópicos (títulos, tópicos com recuo, tarefas, negrito). Salva sozinho. */
export function NoteEditor({
  nodeId,
  initial,
  highlight,
  onStatus,
  onOutline,
}: {
  nodeId: string;
  initial: string;
  highlight?: { query: string; line: number | null } | null;
  onStatus: (s: SaveStatus) => void;
  /** Avisa os títulos (H1/H2) da nota e como pular até um deles — alimenta o painel "Estrutura". */
  onOutline?: (nodeId: string, items: OutlineItem[], jump: (pos: number) => void) => void;
}) {
  const { status, schedule } = useAutosave(nodeId);
  // O status sobe para a barra de status da tela
  useEffect(() => onStatus(status), [status, onStatus]);

  const outlineRef = useRef(onOutline);
  useEffect(() => {
    outlineRef.current = onOutline;
  }, [onOutline]);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const jump = useCallback((pos: number) => {
    editorRef.current?.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  }, []);
  const report = useCallback(
    (ed: NonNullable<ReturnType<typeof useEditor>>) => {
      const items: OutlineItem[] = [];
      ed.state.doc.descendants((node, pos) => {
        if (node.type.name !== "heading") return;
        items.push({ level: Number(node.attrs.level), text: node.textContent.trim() || "(sem título)", pos });
        return false;
      });
      outlineRef.current?.(nodeId, items, jump);
    },
    [nodeId, jump],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: parse(initial),
    editorProps: { attributes: { class: "note-prose", "aria-label": "Texto da nota", spellcheck: "true" } },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
      report(ed);
    },
    onUpdate: ({ editor: ed }) => {
      schedule(JSON.stringify(ed.getJSON()));
      report(ed);
    },
  });

  // Aberta pela busca: seleciona a primeira ocorrência do texto procurado e rola até ela
  const query = highlight?.query.toLowerCase();
  useEffect(() => {
    if (!editor || !query) return;
    let found: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (found || !node.isText || !node.text) return;
      const i = node.text.toLowerCase().indexOf(query);
      if (i >= 0) found = { from: pos + i, to: pos + i + query.length };
    });
    if (found) editor.chain().focus().setTextSelection(found).scrollIntoView().run();
  }, [editor, query]);

  const run = (fn: () => boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };
  const c = () => editor!.chain().focus();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {editor && (
        <div className="flex flex-none flex-wrap gap-1 border-b border-[#2a3340] px-3 py-1.5 max-md:order-last max-md:flex-nowrap max-md:border-b-0 max-md:border-t max-md:border-[#2f6a96] max-md:bg-[#1b1f27]">
          <button type="button" className={btn} onMouseDown={run(() => c().toggleHeading({ level: 1 }).run())}>
            H1
          </button>
          <button type="button" className={btn} onMouseDown={run(() => c().toggleHeading({ level: 2 }).run())}>
            H2
          </button>
          <button type="button" className={btn} onMouseDown={run(() => c().toggleBulletList().run())}>
            • Tópico
          </button>
          <button
            type="button"
            className={btn}
            aria-label="Recuar"
            onMouseDown={run(() => c().sinkListItem("listItem").run() || c().sinkListItem("taskItem").run())}
          >
            ⇥
          </button>
          <button
            type="button"
            className={btn}
            aria-label="Desfazer recuo"
            onMouseDown={run(() => c().liftListItem("listItem").run() || c().liftListItem("taskItem").run())}
          >
            ⇤
          </button>
          <button type="button" className={btn} onMouseDown={run(() => c().toggleTaskList().run())}>
            ☐ Tarefa
          </button>
          <button type="button" className={`${btn} font-bold`} onMouseDown={run(() => c().toggleBold().run())}>
            B
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
