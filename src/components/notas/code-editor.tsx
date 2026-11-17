"use client";

import { useEffect, useRef, useState } from "react";
import { useAutosave, type SaveStatus } from "./use-autosave";

/** Editor de texto/código com números de linha. (Cores de sintaxe entram na etapa seguinte.) */
export function CodeEditor({
  nodeId,
  initial,
  onStatus,
}: {
  nodeId: string;
  initial: string;
  onStatus: (s: SaveStatus) => void;
}) {
  const { status, schedule } = useAutosave(nodeId);
  useEffect(() => onStatus(status), [status, onStatus]);
  const [value, setValue] = useState(initial);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = value.split("\n").length;

  const change = (next: string) => {
    setValue(next);
    schedule(next);
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[#14181d] font-mono text-[13px] leading-[1.6]">
      <div
        ref={gutter}
        aria-hidden
        className="absolute inset-y-0 left-0 w-10 select-none overflow-hidden border-r border-[#20262e] bg-[#14181d] py-3 pr-2 text-right text-[#4b5563]"
      >
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        wrap="off"
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        aria-label="Código"
        onChange={(e) => change(e.target.value)}
        onScroll={(e) => {
          if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
        }}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          e.preventDefault(); // Tab recua em vez de pular para outro campo
          const el = e.currentTarget;
          el.setRangeText("  ", el.selectionStart, el.selectionEnd, "end");
          change(el.value);
        }}
        className="absolute inset-y-0 left-10 right-0 resize-none whitespace-pre bg-transparent py-3 pl-3 pr-3 text-[#d6dde6] outline-none max-md:text-[14px]"
      />
    </div>
  );
}
