"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Pergunta ao servidor de tempos em tempos; quando a conta for liberada, a página redireciona. */
export function AutoRefresh({ everyMs = 10000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(timer);
  }, [router, everyMs]);
  return null;
}
