import "server-only";
import { headers } from "next/headers";

/**
 * IP do visitante, usado só para limitar tentativas.
 * x-forwarded-for só é confiável atrás de um proxy reverso nosso (na VPS, o Caddy).
 */
export async function getClientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}
