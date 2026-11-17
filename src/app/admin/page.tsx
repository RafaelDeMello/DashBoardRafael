import { logout } from "@/app/login/actions";
import { Starfield } from "@/components/starfield";
import { listAccounts, type AccountStatus } from "@/lib/admin";
import { verifyAdmin } from "@/lib/dal";
import { setAccountStatusAction } from "./actions";

export const metadata = { title: "Acessos · Only-Tasks" };

const LABEL: Record<AccountStatus, { text: string; cls: string }> = {
  pending: { text: "Aguardando", cls: "bg-[#fbf0d9] text-[#8a5a10]" },
  approved: { text: "Liberado", cls: "bg-[#e4f2e8] text-[#2f7d4f]" },
  blocked: { text: "Bloqueado", cls: "bg-[#f6e3e1] text-[#a2433b]" },
};

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function StatusButton({
  userId,
  status,
  children,
  primary,
}: {
  userId: string;
  status: "approved" | "blocked";
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <form action={setAccountStatusAction}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={
          primary
            ? "rounded-md border border-[#2f6a96] bg-[#16283d] px-3 py-1.5 text-xs text-[#dfe6f5] transition-colors hover:bg-[#1d3652]"
            : "rounded-md border border-[#dcdad5] bg-white px-3 py-1.5 text-xs text-[#37352f] transition-colors hover:bg-[#f7f7f5]"
        }
      >
        {children}
      </button>
    </form>
  );
}

export default async function AdminPage() {
  const admin = await verifyAdmin();
  const accounts = await listAccounts();

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] md:flex-row">
      <Starfield />

      <nav
        aria-label="Administração"
        className="relative z-10 flex flex-none items-center justify-between gap-4 px-4 py-3 font-retro text-lg uppercase tracking-widest text-[#9aa3b2] md:w-[150px] md:flex-col md:items-stretch md:justify-between md:px-3 md:py-5"
      >
        <div>
          <p className="mb-4 hidden font-pixel text-sm text-[#f4f6fb] md:block">OT</p>
          <p className="border-l-2 border-neon bg-[#16283d] px-2 py-1.5 text-[#dfe6f5]">Acessos</p>
        </div>
        <form action={logout}>
          <button type="submit" className="px-2 py-1.5 transition-colors hover:text-neon">
            Sair
          </button>
        </form>
      </nav>

      <main className="relative z-10 flex min-w-0 flex-1 px-3 pt-2 md:px-5 md:pt-5">
        <article className="min-w-0 flex-1 overflow-y-auto rounded-t-lg bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-[#37352f] md:px-[30px]">
          <div className="mb-3 text-xs text-[#9b9a97]">Only-Tasks · {admin.email}</div>
          <h1 className="text-[28px] font-medium leading-tight text-[#2f2f2c]">Acessos</h1>
          <p className="mb-4 mt-1 text-sm text-[#787774]">Libere ou bloqueie quem criou conta.</p>

          {accounts.length === 0 ? (
            <div className="rounded-lg bg-[#f7f7f5] p-6 text-sm text-[#787774]">
              Ninguém criou conta ainda. Quando alguém se cadastrar, aparece aqui para você liberar.
            </div>
          ) : (
            <ul>
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#f0efeb] py-3"
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="truncate text-sm font-medium">{a.name || "Sem nome"}</div>
                    <div className="truncate text-xs text-[#9b9a97]">
                      {a.email} · {fmt.format(a.createdAt)}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${LABEL[a.status].cls}`}>
                    {LABEL[a.status].text}
                  </span>
                  <div className="flex gap-2">
                    {a.status !== "approved" && (
                      <StatusButton userId={a.id} status="approved" primary>
                        Liberar
                      </StatusButton>
                    )}
                    {a.status !== "blocked" && (
                      <StatusButton userId={a.id} status="blocked">
                        Bloquear
                      </StatusButton>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </main>
    </div>
  );
}
