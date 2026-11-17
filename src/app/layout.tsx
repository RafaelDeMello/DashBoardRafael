import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fontes de videogame antigo: VT323 (terminal) para rótulos e
// Press Start 2P (arcade) para títulos e botões
const vt = VT323({
  variable: "--font-vt",
  subsets: ["latin"],
  weight: "400",
});

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Only-Tasks",
  description: "Organizador de rotinas diárias",
  applicationName: "Only-Tasks",
  // iPhone/iPad: ao adicionar à tela inicial, abre sem a barra do Safari
  appleWebApp: { capable: true, title: "Only-Tasks", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f", // cor da barra do navegador/sistema no celular
  viewportFit: "cover", // usa a tela toda (a folha respeita as áreas seguras do notch)
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${vt.variable} ${pixel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
