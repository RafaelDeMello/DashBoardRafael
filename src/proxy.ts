import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Checagem "otimista": só olha se existe um cookie de sessão, sem ir ao banco.
// Serve para mandar visitantes para o login rapidamente. NÃO é a segurança de
// verdade: ela está em verifySession() (src/lib/dal.ts), chamado em cada página
// e ação que toca em dados.
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasSessionCookie && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// Caminhos PÚBLICOS (o proxy nem roda neles): arquivos estáticos, o manifesto e os ícones
// do PWA (o navegador os pede SEM login, senão instalar o app quebra) e o health check
// do Docker. Todo o resto exige cookie de sessão.
// O matcher precisa ser um valor literal (o Next o lê sem executar o arquivo);
// tests/proxy.test.ts confere quais caminhos ele libera e quais protege.
export const config = {
  matcher: [
    "/((?!(?:_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|pwa-icon|icon|apple-icon|api/health)(?:$|/)|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
