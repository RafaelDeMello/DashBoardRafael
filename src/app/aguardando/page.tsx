import { redirect } from "next/navigation";
import { logout } from "@/app/login/actions";
import { Starfield } from "@/components/starfield";
import { verifyAccount } from "@/lib/dal";
import { AutoRefresh } from "./auto-refresh";

export const metadata = { title: "Aguardando liberação · Only-Tasks" };

export default async function WaitingPage() {
  const user = await verifyAccount();

  // Já liberada: segue para o lugar certo (esta tela só existe para quem ainda não tem acesso)
  if (user.status === "approved") redirect(user.role === "admin" ? "/admin" : "/");

  const blocked = user.status === "blocked";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <Starfield />
      <AutoRefresh />
      <section className="relative z-10 w-full max-w-sm border-2 border-neon/70 bg-carbon/95 p-7 text-center shadow-[6px_6px_0_rgba(25,230,255,0.25)]">
        <h1 className="font-retro text-2xl uppercase tracking-[0.18em] text-neon">
          {blocked ? "Acesso bloqueado" : "Aguardando liberação"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#aab3c2]">
          {blocked
            ? "O acesso desta conta foi bloqueado. Fale com quem administra o Only-Tasks."
            : "Sua conta foi criada. Assim que for liberada, você poderá entrar."}
        </p>
        <p className="mt-3 break-all font-mono text-xs text-[#7d8696]">{user.email}</p>

        <form action={logout} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-none border-2 border-steel bg-[#0b0d11] px-6 py-3 font-retro text-lg uppercase tracking-widest text-white transition-colors hover:border-neon hover:text-neon"
          >
            Sair
          </button>
        </form>
        {!blocked && (
          <p className="mt-4 text-xs text-[#7d8696]">Esta tela atualiza sozinha quando for liberada.</p>
        )}
      </section>
    </main>
  );
}
