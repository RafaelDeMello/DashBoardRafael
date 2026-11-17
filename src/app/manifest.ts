import type { MetadataRoute } from "next";

// Manifesto do PWA: permite "instalar" o app na tela inicial do celular ou do computador.
// Não há service worker de propósito: o app é online (os dados vivem no servidor) e um
// cache de páginas poderia mostrar dados de outra sessão depois de um logout.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Only-Tasks",
    short_name: "Only-Tasks",
    description: "Organizador de rotinas diárias",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
