// Nome do cookie de sessão, separado em um arquivo sem dependências
// para poder ser importado também pelo proxy.ts (que não deve tocar no banco).
// O prefixo __Host- obriga o navegador a exigir HTTPS, path=/ e sem domain;
// só funciona com HTTPS, por isso só em produção.
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-session" : "session";
