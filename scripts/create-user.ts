// Cria um usuário já LIBERADO (ou um administrador, com --admin). Quem se cadastra pela
// tela nasce "aguardando liberação"; este script serve para o administrador e para contas
// criadas direto no servidor.
// Uso local: npm run user:create            (conta comum)
//            npm run user:create -- --admin (administrador: só vê o painel de acessos)
// Uso em produção: docker compose -f docker-compose.prod.yml run --rm -it migrate node scripts/create-user.ts
import readline from "node:readline";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { users } from "../src/db/schema.ts";
import { hashPassword } from "../src/lib/password.ts";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});
let muted = false;
// Esconde o que é digitado quando muted = true (para a senha)
(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => {
  if (!muted) process.stdout.write(s);
};

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    muted = hidden;
    rl.question("", (answer) => {
      muted = false;
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido")),
  name: z.string().trim().max(100).optional(),
  // máximo evita que alguém envie uma senha gigante só para gastar CPU do servidor
  password: z.string().min(12, "Use pelo menos 12 caracteres").max(128),
});

const isAdmin = process.argv.includes("--admin");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida (crie o .env a partir do .env.example)");

  const email = await ask("E-mail: ");
  const name = await ask("Nome (opcional): ");
  const password = await ask("Senha (mín. 12 caracteres): ", true);
  const confirm = await ask("Repita a senha: ", true);
  rl.close();

  if (password !== confirm) throw new Error("As senhas não conferem");

  const parsed = schema.safeParse({ email, name: name || undefined, password });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  try {
    await db.insert(users).values({
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      passwordHash: await hashPassword(parsed.data.password),
      role: isAdmin ? "admin" : "user",
      status: "approved",
    });
    console.log(`${isAdmin ? "Administrador" : "Usuário"} criado: ${parsed.data.email}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Erro:", err instanceof Error ? err.message : err);
  process.exit(1);
});
