"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { searchNotesAction } from "@/app/notas/actions";
import { SEARCH_MAX, SEARCH_MIN, type SearchResult } from "@/lib/note-search";
import { FileGlyph } from "./icons";

type Scope = "repo" | "all";

/** Trecho com a palavra encontrada em destaque âmbar. */
function Snippet({ text, start, end }: { text: string; start: number; end: number }) {
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-[#5a4a14] px-px text-[#ffe9a8]">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

/** Painel de busca (no lugar da árvore): procura no nome e no conteúdo, agrupa por arquivo. */
export function SearchPanel({
  repoId,
  repoName,
  initialQuery = "",
  onOpen,
  onClose,
}: {
  repoId: string;
  repoName: string;
  initialQuery?: string;
  onOpen: (r: SearchResult, query: string, line: number | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<Scope>("repo");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const seq = useRef(0); // ignora respostas antigas que chegam depois de uma busca mais nova

  const term = query.trim();
  const valid = term.length >= SEARCH_MIN;

  useEffect(() => {
    if (!valid) return;
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      const r = await searchNotesAction({ query: term, repoId: scope === "repo" ? repoId : null }).catch(() => null);
      if (mine !== seq.current) return;
      setLoading(false);
      if (!r || !r.ok) {
        setFailed(true);
        return;
      }
      setFailed(false);
      setResults(r.results);
      setTruncated(r.truncated);
    }, 300);
    return () => clearTimeout(timer);
  }, [term, scope, repoId, valid]);

  const shown = valid ? results : [];
  const totalMatches = shown.reduce((n, r) => n + Math.max(r.total, r.nameMatch ? 1 : 0), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[26px] flex-none items-center justify-between px-2">
        <span className="font-retro text-[16px] uppercase tracking-[0.2em] text-[#19e6ff]">Buscar</span>
        <button type="button" aria-label="Fechar a busca" onClick={onClose} className="text-[#8b949e] hover:text-white">
          <X size={15} />
        </button>
      </div>
      <div className="flex-none px-2 pb-1">
        <div className="flex items-center gap-1.5 border border-[#19e6ff] bg-[#0f141a] px-2">
          <Search size={14} className="flex-none text-[#6e7a8a]" />
          <input
            autoFocus
            value={query}
            maxLength={SEARCH_MAX}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            placeholder="Nome ou conteúdo"
            aria-label="Buscar nas notas"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-[#e6edf3] outline-none placeholder:text-[#6e7a8a] max-md:py-2.5 max-md:text-base"
          />
          <span className="flex-none text-[11px] text-[#6e7a8a]">
            {valid ? (loading ? "…" : `${shown.length} ${shown.length === 1 ? "arquivo" : "arquivos"}`) : ""}
          </span>
        </div>
        <div role="radiogroup" aria-label="Onde buscar" className="mt-1.5 flex text-[11px]">
          {(
            [
              ["repo", `Em ${repoName}`],
              ["all", "Todos os repositórios"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={scope === key}
              onClick={() => setScope(key)}
              className={`min-w-0 flex-1 truncate border px-1.5 py-1 max-md:py-3 ${
                scope === key
                  ? "border-[#19e6ff] bg-[#16283d] text-[#19e6ff]"
                  : "border-[#3a4150] text-[#8b949e] hover:text-[#cdd5df]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {!valid && <p className="px-3 py-3 text-xs text-[#8b949e]">Digite pelo menos {SEARCH_MIN} letras.</p>}
        {valid && failed && <p className="px-3 py-3 text-xs text-[#f27d7d]">Não foi possível buscar agora.</p>}
        {valid && !failed && !loading && shown.length === 0 && (
          <p className="px-3 py-3 text-xs text-[#8b949e]">Nada encontrado para “{term}”.</p>
        )}
        {shown.map((r) => (
          <div key={r.id} className="mb-0.5">
            <button
              type="button"
              onClick={() => onOpen(r, term, r.matches[0]?.line ?? null)}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-[12.5px] hover:bg-[#222a35] max-md:py-2.5 max-md:text-base"
            >
              <ChevronRight size={13} className="flex-none rotate-90 text-[#8b949e]" />
              <FileGlyph name={r.name} />
              <span className="min-w-0 flex-1 truncate">
                {r.name}
                {(scope === "all" || r.path.length > 0) && (
                  <span className="ml-1.5 text-[11px] text-[#6e7a8a]">
                    {[...(scope === "all" ? [r.repoName] : []), ...r.path].join(" › ")}
                  </span>
                )}
              </span>
              <span className="flex-none rounded-full bg-[#2a303a] px-1.5 text-[10px] text-[#8b949e]">
                {Math.max(r.total, 1)}
              </span>
            </button>
            {r.matches.map((m) => (
              <button
                key={m.line}
                type="button"
                onClick={() => onOpen(r, term, m.line)}
                className="block w-full truncate py-0.5 pl-9 pr-2 text-left font-mono text-[11px] text-[#9aa5b4] hover:bg-[#222a35] max-md:py-3 max-md:text-[13px]"
              >
                <span className="mr-2 text-[#4b5563]">{m.line}</span>
                <Snippet text={m.text} start={m.start} end={m.end} />
              </button>
            ))}
            {r.total > r.matches.length && (
              <p className="pl-9 text-[10px] text-[#6e7a8a]">+ {r.total - r.matches.length} ocorrências neste arquivo</p>
            )}
          </div>
        ))}
        {valid && truncated && (
          <p className="px-3 pt-2 text-[11px] text-[#8b949e]">Mostrando só os primeiros 50 arquivos. Refine a busca.</p>
        )}
        {valid && !failed && shown.length > 0 && (
          <p className="px-3 pt-2 text-[11px] text-[#6e7a8a]">{totalMatches} resultados</p>
        )}
      </div>
    </div>
  );
}
