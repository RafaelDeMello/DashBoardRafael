// Limites do cadastro aberto (usados por src/app/cadastro/actions.ts e pelos testes).
export const SIGNUP_WINDOW_MS = 60 * 60 * 1000;
/** Tentativas de cadastro por hora, por IP (todas contam, não só as erradas). */
export const SIGNUP_MAX_PER_IP = 5;
/** Teto de contas aguardando liberação: segura spam de cadastros. */
export const MAX_PENDING = 50;
