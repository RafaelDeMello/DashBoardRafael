import { sql } from "drizzle-orm";
import { db } from "@/db";

// Verificação de saúde para o Docker e para monitoramento. É pública de propósito e NÃO
// devolve nada sobre usuários nem sobre o banco além de "ok" ou "falhou".
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "falhou" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
