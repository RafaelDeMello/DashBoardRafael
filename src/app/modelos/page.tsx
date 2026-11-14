import { AppShell, ComingSoon } from "@/components/app-shell";
import { verifySession } from "@/lib/dal";
import { loadShell } from "@/lib/shell";

export const metadata = { title: "Modelos · Only-Tasks" };

export default async function ModelosPage() {
  const user = await verifySession();
  const { today, expanded, progress } = await loadShell(user.id);

  return (
    <AppShell active="modelos" expanded={expanded} date={today} progress={progress}>
      <ComingSoon title="Modelos">
        <p>Em breve: criar, editar e escolher os modelos de dia.</p>
        <p className="mt-2">
          Por enquanto existe um modelo padrão: no menu “⋯” de qualquer dia, use “Salvar este dia
          como modelo”. Ele é usado em “Usar o modelo” ao criar um dia novo.
        </p>
      </ComingSoon>
    </AppShell>
  );
}
