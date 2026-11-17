import { notFound } from "next/navigation";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { RepoView } from "@/components/notas/repo-view";
import { verifySession } from "@/lib/dal";
import { getFile, getRepo, getTree, listRepos } from "@/lib/notes";
import { loadShell } from "@/lib/shell";

export const metadata = { title: "Notas · Only-Tasks" };

export default async function RepoPage({
  params,
  searchParams,
}: {
  params: Promise<{ repoId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await verifySession();
  const { repoId } = await params;
  const { f } = await searchParams;
  // Id que não é um UUID nem chega ao banco
  if (!z.uuid().safeParse(repoId).success) notFound();

  const [shell, repo, nodes, repos] = await Promise.all([
    loadShell(user.id),
    getRepo(user.id, repoId),
    getTree(user.id, repoId),
    listRepos(user.id),
  ]);
  if (!repo || !nodes) notFound();

  const fileId = typeof f === "string" && z.uuid().safeParse(f).success ? f : null;
  const file = fileId ? await getFile(user.id, fileId) : null;
  // O arquivo precisa ser deste repositório
  const openFile = file && file.repoId === repoId ? file : null;

  return (
    <AppShell active="notas" expanded={shell.expanded} date={shell.today} progress={shell.progress}>
      <article className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#2f6a96] bg-[#14181d] text-[#cdd5df]">
        <RepoView
          repo={{ id: repo.id, name: repo.name }}
          otherRepos={repos.filter((r) => r.id !== repo.id).map((r) => ({ id: r.id, name: r.name }))}
          nodes={nodes}
          file={openFile ? { id: openFile.id, name: openFile.name, content: openFile.content } : null}
        />
      </article>
    </AppShell>
  );
}
