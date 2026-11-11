// (sem "server-only": o script scripts/create-user.ts também usa este arquivo,
// e o argon2 já não compila para o navegador de qualquer forma)
import { hash, verify } from "@node-rs/argon2";

// argon2id com os parâmetros mínimos recomendados pela OWASP
// (19 MiB de memória, 2 iterações, 1 thread). O salt é gerado e
// embutido no hash automaticamente.
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password).catch(() => false);
}

// Hash "de mentira" usado quando o e-mail não existe, para que o login
// demore o mesmo tempo com e-mail certo ou errado (evita descobrir
// quais e-mails têm conta medindo o tempo da resposta).
let dummy: Promise<string> | undefined;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword("senha-descartavel-para-igualar-tempo");
  return dummy;
}
