import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem cacheComponents/partialPrefetching: o app é privado e toda tela depende
  // de quem está logado (cookies), então renderização dinâmica comum é o certo.

  // Gera um servidor mínimo (.next/standalone) com só o que o app usa: imagem Docker pequena.
  output: "standalone",
  // Não anuncia "X-Powered-By: Next.js" (menos informação para quem faz varredura)
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Ninguém pode embutir o app em outro site (proteção contra clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // O HSTS (só vale em HTTPS) fica no Caddy: deploy/Caddyfile
        ],
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
