import { AppShell } from "@/components/app-shell";
import { Win } from "@/components/win";
import { countActiveSessions } from "@/lib/account";
import { verifySession } from "@/lib/dal";
import { loadShell } from "@/lib/shell";
import { DevicesPanel, NameForm, PasswordForm } from "./settings-forms";

export const metadata = { title: "Configurações · Only-Tasks" };

export default async function ConfiguracoesPage() {
  const user = await verifySession();
  const [{ today, expanded, progress }, activeSessions] = await Promise.all([
    loadShell(user.id),
    countActiveSessions(user.id),
  ]);

  return (
    <AppShell active="configuracoes" expanded={expanded} date={today} progress={progress}>
      <article className="min-w-0 flex-1 overflow-y-auto bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-[#37352f] md:px-[30px]">
        <div className="mb-4 text-xs text-[#9b9a97]">Only-Tasks</div>
        <div className="flex flex-col gap-5 pb-2 pr-[3px]">
          <Win title="Perfil">
            <div className="p-4">
              <p className="mb-3 text-xs text-[#9b9a97]">E-mail: {user.email}</p>
              <NameForm name={user.name ?? ""} />
            </div>
          </Win>

          <Win title="Senha">
            <div className="p-4">
              <PasswordForm />
            </div>
          </Win>

          <Win title="Aparelhos">
            <div className="p-4">
              <DevicesPanel activeSessions={activeSessions} />
            </div>
          </Win>
        </div>
      </article>
    </AppShell>
  );
}
