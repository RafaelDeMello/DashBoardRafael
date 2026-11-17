import path from "node:path";
import { defineConfig } from "vitest/config";
import { assertTestDatabase, testDatabaseUrl } from "./tests/test-db-url.mts";

try {
  process.loadEnvFile(".env");
} catch {
  /* sem .env: usa o ambiente */
}

const testUrl = testDatabaseUrl();
assertTestDatabase(testUrl);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    // O código do app (src/db) lê DATABASE_URL: nos testes ela aponta SEMPRE para o banco de teste
    env: { DATABASE_URL: testUrl },
    // Os testes de banco compartilham um servidor: um arquivo por vez evita interferência
    fileParallelism: false,
  },
});
