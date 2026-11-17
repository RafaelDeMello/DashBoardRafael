"use client";

import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  createRepoAction,
  deleteRepoAction,
  renameRepoAction,
  restoreRepoAction,
} from "@/app/notas/actions";
import { NOTE_ERRORS } from "@/lib/note-messages";
import { DarkDialog, ToastBar, darkBtn, darkBtnDanger, darkBtnGhost, darkInput, type Toast } from "./dlg";
import { PixelFolder } from "./pixel-folder";

type Repo = { id: string; name: string; files: number };
type Dialog = null | { kind: "new" } | { kind: "rename" | "delete"; repo: Repo };

function NewRepoForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createRepoAction, undefined);
  return (
    <DarkDialog title="Novo repositório" onClose={onClose}>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-[#8b949e]">
          Nome
          <input name="name" autoFocus required maxLength={100} placeholder="Estudos" className={darkInput} />
        </label>
        {state?.error && (
          <p role="alert" className="text-xs text-[#f27d7d]">
            {NOTE_ERRORS[state.error] ?? NOTE_ERRORS.invalid}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={darkBtn}>
            Criar
          </button>
          <button type="button" onClick={onClose} className={darkBtnGhost}>
            Cancelar
          </button>
        </div>
      </form>
    </DarkDialog>
  );
}

function RenameRepoForm({ repo, onClose, onDone }: { repo: Repo; onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <DarkDialog title="Renomear repositório" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          const name = String(new FormData(e.currentTarget).get("name") ?? "");
          const r = await renameRepoAction({ repoId: repo.id, name });
          setPending(false);
          if (r.ok) onDone();
          else setError(r.error);
        }}
      >
        <input name="name" autoFocus defaultValue={repo.name} maxLength={100} aria-label="Nome" className={darkInput} />
        {error && (
          <p role="alert" className="text-xs text-[#f27d7d]">
            {NOTE_ERRORS[error] ?? NOTE_ERRORS.invalid}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={darkBtn}>
            Salvar
          </button>
          <button type="button" onClick={onClose} className={darkBtnGhost}>
            Cancelar
          </button>
        </div>
      </form>
    </DarkDialog>
  );
}

function DeleteRepoForm({
  repo,
  onClose,
  onDone,
}: {
  repo: Repo;
  onClose: () => void;
  onDone: (r: Repo) => void;
}) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <DarkDialog title="Apagar repositório" danger onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-xs leading-relaxed">
          Isso apaga <b className="text-[#f27d7d]">{repo.name}</b> e tudo dentro dele ({repo.files}{" "}
          {repo.files === 1 ? "arquivo" : "arquivos"}). Você poderá desfazer por alguns segundos.
        </p>
        <label className="flex flex-col gap-1 text-xs text-[#8b949e]">
          Digite o nome para confirmar
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className={`${darkInput} !border-[#8a3b3b]`}
            aria-label="Nome do repositório"
          />
        </label>
        {error && (
          <p role="alert" className="text-xs text-[#f27d7d]">
            {NOTE_ERRORS[error] ?? NOTE_ERRORS.invalid}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || typed !== repo.name}
            className={darkBtnDanger}
            onClick={async () => {
              setPending(true);
              const r = await deleteRepoAction({ repoId: repo.id, confirm: typed });
              setPending(false);
              if (r.ok) onDone(repo);
              else setError(r.error);
            }}
          >
            Apagar
          </button>
          <button type="button" onClick={onClose} className={darkBtnGhost}>
            Cancelar
          </button>
        </div>
      </div>
    </DarkDialog>
  );
}

/** Raiz de Notas: cada repositório é uma pasta em pixel. Duplo clique (ou Enter) abre. */
export function NotasHome({ repos }: { repos: Repo[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);
  const closeToast = useCallback(() => setToast(null), []);

  const open = (id: string) => router.push(`/notas/${id}`);
  const current = repos.find((r) => r.id === selected) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[34px] flex-none items-center gap-2 border-b border-[#2f6a96] bg-[#1b1f27] px-3">
        <span className="font-retro text-[17px] uppercase tracking-[0.2em] text-[#19e6ff]">Repositórios</span>
        <div className="ml-auto flex gap-1.5 max-md:hidden">
          <button type="button" className={darkBtnGhost} disabled={!current} onClick={() => current && open(current.id)}>
            Abrir
          </button>
          <button
            type="button"
            className={darkBtnGhost}
            disabled={!current}
            onClick={() => current && setDialog({ kind: "rename", repo: current })}
          >
            Renomear
          </button>
          <button
            type="button"
            className={darkBtnGhost}
            disabled={!current}
            onClick={() => current && setDialog({ kind: "delete", repo: current })}
          >
            Apagar
          </button>
          <button type="button" className={darkBtn} onClick={() => setDialog({ kind: "new" })}>
            + Novo
          </button>
        </div>
        <button type="button" className={`${darkBtn} ml-auto md:hidden`} onClick={() => setDialog({ kind: "new" })}>
          + Novo
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4" onClick={() => setSelected(null)}>
        <div className="mb-3 text-xs text-[#8b949e]">Notas</div>
        {repos.length === 0 ? (
          <div className="max-w-md border border-[#2f3744] bg-[#1b1f27] p-4 text-sm text-[#9aa5b4]">
            <p className="font-medium text-[#e6edf3]">Crie seu primeiro repositório</p>
            <p className="mt-1">
              Um repositório é como um projeto: guarda as suas pastas e arquivos de estudo. Use “Novo” para criar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4 lg:grid-cols-6">
            {repos.map((r) => {
              const isSel = r.id === selected;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`${r.name}, ${r.files} ${r.files === 1 ? "arquivo" : "arquivos"}`}
                  aria-pressed={isSel}
                  onClick={(e) => {
                    e.stopPropagation();
                    // No toque, um toque abre; com mouse, um clique seleciona e o duplo clique abre
                    if (window.matchMedia("(pointer: coarse)").matches) open(r.id);
                    else setSelected(r.id);
                  }}
                  onDoubleClick={() => open(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") open(r.id);
                    if (e.key === "F2") setDialog({ kind: "rename", repo: r });
                    if (e.key === "Delete") setDialog({ kind: "delete", repo: r });
                  }}
                  className={`flex flex-col items-center gap-1.5 border px-1 py-2.5 text-center text-sm outline-none transition-colors focus-visible:border-[#19e6ff] ${
                    isSel ? "border-[#19e6ff] bg-[#1d2733]" : "border-transparent hover:bg-[#1b1f27]"
                  }`}
                >
                  <PixelFolder />
                  <span className="max-w-full break-words font-medium text-[#e6edf3]">{r.name}</span>
                  <span className="text-xs text-[#8b949e]">
                    {r.files} {r.files === 1 ? "arquivo" : "arquivos"}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setDialog({ kind: "new" })}
              className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-[#2f6a96] px-1 py-2.5 text-sm text-[#19e6ff] hover:bg-[#1b1f27]"
            >
              <Plus size={26} />
              Novo repositório
            </button>
          </div>
        )}
        {current && (
          <div className="mt-6 flex flex-wrap gap-2 md:hidden">
            <button type="button" className={darkBtnGhost} onClick={() => setDialog({ kind: "rename", repo: current })}>
              Renomear
            </button>
            <button type="button" className={darkBtnGhost} onClick={() => setDialog({ kind: "delete", repo: current })}>
              Apagar
            </button>
          </div>
        )}
      </div>

      {dialog?.kind === "new" && <NewRepoForm onClose={closeDialog} />}
      {dialog?.kind === "rename" && (
        <RenameRepoForm
          repo={dialog.repo}
          onClose={closeDialog}
          onDone={() => {
            closeDialog();
            router.refresh();
          }}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteRepoForm
          repo={dialog.repo}
          onClose={closeDialog}
          onDone={(r) => {
            closeDialog();
            setSelected(null);
            setToast({
              
              text: `Repositório “${r.name}” apagado`,
              undo: async () => {
                await restoreRepoAction({ repoId: r.id });
                router.refresh();
              },
            });
            router.refresh();
          }}
        />
      )}
      <ToastBar toast={toast} onClose={closeToast} />
    </div>
  );
}
