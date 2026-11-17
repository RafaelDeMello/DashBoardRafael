import { AppShell } from "@/components/app-shell";
import { countActiveSessions } from "@/lib/account";
import { verifySession } from "@/lib/dal";
import { loadShell } from "@/lib/shell";
import { DevicesPanel, NameForm, PasswordForm } from "./settings-forms";

export const metadata = { title: "Configurações · Only-Tasks" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 border-b border-[#ebeae6] pb-2 text-base font-medium text-[#2f2f2c]">{title}</h2>
      {children}
    </section>
  );
}

export default async function ConfiguracoesPage() {
  const user = await verifySession();
  const [{ today, expanded, progress }, activeSessions] = await Promise.all([
    loadShell(user.id),
    countActiveSessions(user.id),
  ]);

  return (
    <AppShell active="configuracoes" expanded={expanded} date={today} progress={progress}>
      <article className="min-w-0 flex-1 overflow-y-auto rounded-t-lg bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-[#37352f] md:px-[30px]">
        <div className="mb-3 text-xs text-[#9b9a97]">Only-Tasks</div>
        <h1 className="mb-6 text-[28px] font-medium leading-tight text-[#2f2f2c]">Configurações</h1>

        <Section title="Perfil">
          <p className="mb-3 text-sm text-[#787774]">E-mail: {user.email}</p>
          <NameForm name={user.name ?? ""} />
        </Section>

        <Section title="Senha">
          <PasswordForm />
        </Section>

        <Section title="Aparelhos">
          <DevicesPanel activeSessions={activeSessions} />
        </Section>
      </article>
    </AppShell>
  );
}
