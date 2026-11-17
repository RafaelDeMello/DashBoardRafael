import { AppShell } from "@/components/app-shell";
import { NotasHome } from "@/components/notas/notas-home";
import { verifySession } from "@/lib/dal";
import { listRepos } from "@/lib/notes";
import { loadShell } from "@/lib/shell";

export const metadata = { title: "Notas · Only-Tasks" };

export default async function NotasPage() {
  const user = await verifySession();
  const [shell, repos] = await Promise.all([loadShell(user.id), listRepos(user.id)]);

  return (
    <AppShell active="notas" expanded={shell.expanded} date={shell.today} progress={shell.progress}>
      <article className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#2f6a96] bg-[#14181d] text-[#cdd5df]">
        <NotasHome repos={repos.map((r) => ({ id: r.id, name: r.name, files: r.files }))} />
      </article>
    </AppShell>
  );
}
