// Aplica as migrações do banco (pasta drizzle/). Roda no servidor de produção, no serviço
// "migrate" do docker-compose.prod.yml, antes de o app subir.
// Uso: node scripts/migrate.ts   (precisa de DATABASE_URL)
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: path.resolve("drizzle") });
  console.log("Migrações aplicadas com sucesso.");
} catch (err) {
  console.error("Falha ao aplicar as migrações:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end();
}
