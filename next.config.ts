import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem cacheComponents/partialPrefetching: o app é privado e toda tela depende
  // de quem está logado (cookies), então renderização dinâmica comum é o certo.
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
