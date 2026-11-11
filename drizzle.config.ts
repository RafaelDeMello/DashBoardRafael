import { defineConfig } from "drizzle-kit";

// drizzle-kit não carrega o .env sozinho
try {
  process.loadEnvFile(".env");
} catch {
  /* sem .env: usa as variáveis do ambiente */
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
