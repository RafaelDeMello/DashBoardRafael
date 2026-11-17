// Os testes usam um banco PRÓPRIO (onlytasks_test), nunca o banco de desenvolvimento:
// eles criam e apagam usuários, e os seus dados reais não podem correr esse risco.

export const TEST_DB_NAME = "onlytasks_test";

/** URL do servidor atual (do .env) trocando só o nome do banco. */
export function testDatabaseUrl(baseUrl: string | undefined = process.env.DATABASE_URL): string {
  if (!baseUrl) throw new Error("DATABASE_URL não definida (crie o .env a partir do .env.example)");
  const url = new URL(baseUrl);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}

/** Trava de segurança: recusa rodar se o banco alvo não for o de teste. */
export function assertTestDatabase(url: string | undefined): asserts url is string {
  const name = url ? new URL(url).pathname.replace(/^\//, "") : "";
  if (!name.endsWith("_test")) {
    throw new Error(
      `Recusado: os testes só podem rodar em um banco terminado em "_test" (recebi "${name || "vazio"}").`,
    );
  }
}
