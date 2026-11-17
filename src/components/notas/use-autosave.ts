"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveFileAction } from "@/app/notas/actions";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

/** Salvamento automático: espera a pessoa parar de digitar (700 ms) e grava; ao sair, grava o que faltou. */
export function useAutosave(nodeId: string) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(async () => {
    if (pending.current === null) return;
    const content = pending.current;
    pending.current = null;
    setStatus("saving");
    const r = await saveFileAction({ nodeId, content });
    if (!r.ok) {
      if (pending.current === null) pending.current = content; // tenta de novo no próximo ciclo
      setStatus("error");
    } else {
      setStatus(pending.current === null ? "saved" : "dirty");
    }
  }, [nodeId]);

  const schedule = useCallback(
    (content: string) => {
      pending.current = content;
      setStatus("dirty");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 700);
    },
    [flush],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current !== null) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      clearTimeout(timer.current);
      void flush(); // saiu da nota: grava o que faltava
    };
  }, [flush]);

  return { status, schedule };
}
