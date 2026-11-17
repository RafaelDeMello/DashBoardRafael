import Link from "next/link";
import { redirect } from "next/navigation";
import { Starfield } from "@/components/starfield";
import { getCurrentUser } from "@/lib/dal";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Criar conta · Only-Tasks" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <Starfield />
      <section className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <h1 className="font-pixel text-[1.65rem] leading-tight text-[#f4f6fb] [text-shadow:3px_3px_0_#2f6a96,6px_6px_0_#16283d] sm:text-3xl">
          Only-Tasks
        </h1>
        <p className="mb-7 mt-5 font-retro text-xl uppercase tracking-[0.3em] text-[#8da0b8]">
          ▸ Acesso com liberação ◂
        </p>

        <div className="w-full border-2 border-neon/70 bg-carbon/95 text-left shadow-[6px_6px_0_rgba(25,230,255,0.25)]">
          <div className="flex items-center justify-between border-b-2 border-neon/40 bg-carbon-2 px-4 py-1.5 font-retro text-xl tracking-widest text-neon">
            <span>CADASTRO.SYS</span>
            <span aria-hidden className="flex gap-1">
              <span className="h-2.5 w-2.5 bg-neon" />
              <span className="h-2.5 w-2.5 bg-white" />
              <span className="h-2.5 w-2.5 bg-steel" />
            </span>
          </div>
          <div className="p-6">
            <SignupForm />
          </div>
        </div>

        <p className="mt-6 font-retro text-xl text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
