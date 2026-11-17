"use client";

import { useEffect } from "react";

// Pequenas peças compartilhadas da tela de Notas (janela escura, botões e aviso "Desfazer").

export const darkInput =
  "w-full rounded-none border border-[#19e6ff] bg-[#0f141a] px-2.5 py-1.5 text-sm text-[#e6edf3] outline-none placeholder:text-[#6e7a8a] max-md:py-2.5 max-md:text-base";
export const darkBtn =
  "rounded-none border border-[#2f6a96] bg-[#16283d] px-3 py-1.5 text-xs text-[#dfe6f5] transition hover:bg-[#1d3652] disabled:opacity-50 max-md:py-2.5 max-md:text-sm";
export const darkBtnGhost =
  "rounded-none border border-[#3a4150] bg-transparent px-3 py-1.5 text-xs text-[#9fb6cc] transition hover:border-[#19e6ff] hover:text-[#19e6ff] disabled:opacity-40 max-md:py-2.5 max-md:text-sm";
export const darkBtnDanger =
  "rounded-none border border-[#8a3b3b] bg-[#3a1f1f] px-3 py-1.5 text-xs text-[#f27d7d] transition hover:bg-[#4a2626] disabled:opacity-40 max-md:py-2.5 max-md:text-sm";

/** Janela modal escura com barra de título retrô. Fecha com Esc. */
export function DarkDialog({
  title,
  danger,
  onClose,
  children,
}: {
  title: string;
  danger?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#07090d]/70 px-3 pt-[12vh] max-md:items-end max-md:px-0 max-md:pt-0">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[360px] border border-[#19e6ff] bg-[#1b1f27] text-[#cdd5df] shadow-[4px_4px_0_#0b0f14] max-md:max-w-none"
      >
        <div
          className={`flex h-[24px] items-center bg-[#16283d] px-2.5 font-retro text-[17px] uppercase tracking-[0.16em] ${
            danger ? "text-[#f27d7d]" : "text-[#19e6ff]"
          }`}
        >
          &gt; {title}
        </div>
        <div className="p-3 text-sm">{children}</div>
      </div>
    </div>
  );
}

export type Toast = { text: string; undo?: () => void };

/** Aviso temporário com "Desfazer". */
export function ToastBar({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[max(4.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-4 border border-[#2f6a96] bg-[#0f141a] px-3 py-2 text-xs text-[#cdd5df] shadow-[3px_3px_0_#0b0f14] md:bottom-6"
    >
      <span className="truncate">{toast.text}</span>
      {toast.undo && (
        <button
          type="button"
          onClick={() => {
            toast.undo?.();
            onClose();
          }}
          className="font-retro text-[15px] uppercase tracking-[0.08em] text-[#19e6ff] hover:text-white"
        >
          Desfazer
        </button>
      )}
    </div>
  );
}
