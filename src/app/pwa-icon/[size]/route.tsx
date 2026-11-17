import { renderIcon } from "@/lib/pwa-icon";

// Ícones do manifesto: /pwa-icon/192, /pwa-icon/512 e /pwa-icon/maskable.
// São públicos de propósito (o navegador os pede sem login para instalar o app).
const SIZES: Record<string, { size: number; maskable: boolean }> = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  maskable: { size: 512, maskable: true },
};

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const spec = SIZES[size];
  if (!spec) return new Response("Not found", { status: 404 });

  const image = renderIcon(spec.size, spec.maskable);
  // ícone nunca muda: cache longo no navegador
  image.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return image;
}
