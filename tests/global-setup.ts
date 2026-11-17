import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { TEST_DB_NAME, assertTestDatabase, testDatabaseUrl } from "./test-db-url.mts";

// Roda uma vez antes de todos os testes: cria o banco de teste (se não existir)
// e aplica as migrações do projeto nele.
export default async function setup() {
  try {
    process.loadEnvFile(".env");
  } catch {
    /* sem .env: usa o ambiente */
  }
  const baseUrl = process.env.DATABASE_URL;
  const testUrl = testDatabaseUrl(baseUrl);
  assertTestDatabase(testUrl);

  // 1) Cria o banco de teste pelo banco "postgres" do mesmo servidor
  const adminUrl = new URL(baseUrl!);
  adminUrl.pathname = "/postgres";
  const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => {} });
  try {
    const exists = await admin`select 1 from pg_database where datname = ${TEST_DB_NAME}`;
    if (exists.length === 0) await admin.unsafe(`create database ${TEST_DB_NAME}`);
  } finally {
    await admin.end();
  }

  // 2) Aplica as migrações (as mesmas do banco de desenvolvimento)
  const client = postgres(testUrl, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: path.resolve("drizzle") });
  } finally {
    await client.end();
  }
}
