"use client";

import { useEffect, useRef } from "react";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentMore, indentWithTab } from "@codemirror/commands";
import {
  HighlightStyle,
  bracketMatching,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { fileIcon } from "@/lib/note-names";
import { loadLanguage } from "./code-lang";
import { useAutosave, type SaveStatus } from "./use-autosave";

// Tema escuro da tela de Notas (mesmas cores dos mockups: roxo nas palavras-chave, azul nas funções...)
const theme = EditorView.theme(
  {
    "&": { height: "100%", backgroundColor: "#14181d", color: "#d6dde6" },
    ".cm-scroller": { fontFamily: "ui-monospace, 'Courier New', monospace", lineHeight: "1.6", overflow: "auto" },
    ".cm-content": { caretColor: "#19e6ff", padding: "12px 0" },
    ".cm-gutters": { backgroundColor: "#14181d", color: "#4b5563", border: "none", borderRight: "1px solid #20262e" },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 10px 0 8px", minWidth: "34px" },
    ".cm-activeLine": { backgroundColor: "#1a2029" },
    ".cm-activeLineGutter": { backgroundColor: "#1a2029", color: "#9aa5b4" },
    "&.cm-focused": { outline: "none" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "#19e6ff" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "#264f78" },
    ".cm-matchingBracket": { backgroundColor: "#2b3544", outline: "1px solid #19e6ff" },
    ".cm-tooltip": { backgroundColor: "#1f2530", border: "1px solid #19e6ff", color: "#cdd5df" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "#2b3544", color: "#fff" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: "#c678dd" },
  { tag: [t.string, t.special(t.string), t.character], color: "#98c379" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#d19a66" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#7f8a99", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: "#61afef" },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: "#e5c07b" },
  { tag: [t.typeName, t.className, t.namespace], color: "#e5c07b" },
  { tag: [t.propertyName, t.attributeName], color: "#d19a66" },
  { tag: [t.tagName, t.angleBracket], color: "#e06c75" },
  { tag: [t.operator, t.regexp, t.escape], color: "#56b6c2" },
  { tag: [t.punctuation, t.bracket, t.separator], color: "#abb2bf" },
  { tag: t.heading, color: "#19e6ff", fontWeight: "bold" },
  { tag: [t.link, t.url], color: "#61afef", textDecoration: "underline" },
  { tag: [t.strong], fontWeight: "bold" },
  { tag: [t.emphasis], fontStyle: "italic" },
  { tag: [t.meta, t.processingInstruction], color: "#7f8a99" },
]);

const SYMBOLS: { label: string; open: string; close?: string }[] = [
  { label: "{ }", open: "{", close: "}" },
  { label: "( )", open: "(", close: ")" },
  { label: "[ ]", open: "[", close: "]" },
  { label: ";", open: ";" },
  { label: "=", open: "=" },
  { label: '"', open: '"', close: '"' },
];

/** Editor de código (CodeMirror) com cores de sintaxe pela extensão, números de linha e salvamento automático. */
export function CodeEditor({
  nodeId,
  name,
  initial,
  onStatus,
}: {
  nodeId: string;
  name: string;
  initial: string;
  onStatus: (s: SaveStatus) => void;
}) {
  const { status, schedule } = useAutosave(nodeId);
  useEffect(() => onStatus(status), [status, onStatus]);

  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const scheduleRef = useRef(schedule);
  useEffect(() => {
    scheduleRef.current = schedule;
  }, [schedule]);

  useEffect(() => {
    if (!host.current) return;
    const language = new Compartment();
    // Em tela de toque a fonte precisa ter 16px, senão o iPhone dá zoom ao tocar no texto
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          drawSelection(),
          history(),
          indentUnit.of("  "),
          EditorState.tabSize.of(2),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion({ activateOnTyping: false }),
          syntaxHighlighting(highlight),
          theme,
          EditorView.theme({ "&": { fontSize: touch ? "16px" : "13px" } }),
          language.of([]),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.contentAttributes.of({ "aria-label": "Código", autocapitalize: "none", autocorrect: "off" }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) scheduleRef.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;

    let alive = true;
    loadLanguage(fileIcon(name))
      .then((ext) => {
        if (alive && ext) view.dispatch({ effects: language.reconfigure(ext) });
      })
      .catch(() => {}); // sem realce, o texto continua editável

    return () => {
      alive = false;
      view.destroy();
      viewRef.current = null;
    };
    // O editor é recriado só ao trocar de arquivo (a tela usa key={id}); o texto inicial não muda depois
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insert = (open: string, close?: string) => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const text = close ? open + view.state.sliceDoc(from, to) + close : open;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + open.length + (close ? to - from : 0) },
    });
    view.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={host} className="min-h-0 flex-1 overflow-hidden" />
      {/* Barra de símbolos: só no celular, acima do teclado */}
      <div className="flex flex-none gap-1 border-t border-[#2f6a96] bg-[#1b1f27] p-1.5 md:hidden">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const view = viewRef.current;
            if (!view) return;
            indentMore(view);
            view.focus();
          }}
          className="flex-1 border border-[#2f6a96] bg-[#14181d] py-2 font-mono text-[15px] text-[#9fb6cc]"
        >
          Tab
        </button>
        {SYMBOLS.map((s) => (
          <button
            key={s.label}
            type="button"
            aria-label={`Inserir ${s.label}`}
            onMouseDown={(e) => {
              e.preventDefault();
              insert(s.open, s.close);
            }}
            className="flex-1 border border-[#2f6a96] bg-[#14181d] py-2 font-mono text-[15px] text-[#9fb6cc]"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
