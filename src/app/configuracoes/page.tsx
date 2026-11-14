import { AppShell, ComingSoon } from "@/components/app-shell";
import { verifySession } from "@/lib/dal";
import { loadShell } from "@/lib/shell";

export const metadata = { title: "Configurações · Only-Tasks" };

export default async function ConfiguracoesPage() {
  const user = await verifySession();
  const { today, expanded, progress } = await loadShell(user.id);

  return (
    <AppShell active="configuracoes" expanded={expanded} date={today} progress={progress}>
      <ComingSoon title="Configurações">
        <p>Em breve: alterar nome e senha e sair de todos os aparelhos.</p>
        <p className="mt-2">Conta atual: {user.email}</p>
      </ComingSoon>
    </AppShell>
  );
}
