import { ImageResponse } from "next/og";

/**
 * Desenha o ícone do app ("OT" no estilo do logo: branco com sombra dura azul-petróleo
 * sobre o preto do fundo). Gerado por código: não precisa de arquivos de imagem.
 *
 * - normal: o ícone ocupa a área toda (o sistema aplica a máscara arredondada)
 * - maskable: o conteúdo fica dentro da "zona segura" (80% central), porque alguns
 *   aparelhos cortam as bordas em círculo
 */
export function renderIcon(size: number, maskable = false): ImageResponse {
  const content = maskable ? 0.5 : 0.62; // altura relativa das letras
  const fontSize = Math.round(size * content);
  const shadow = Math.max(2, Math.round(size * 0.035));

  const letters = (color: string, offset: number) => (
    <div
      style={{
        position: "absolute",
        left: offset,
        top: offset,
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 800,
        letterSpacing: -fontSize * 0.04,
        color,
      }}
    >
      OT
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          position: "relative",
          background: "#0a0a0f",
        }}
      >
        {letters("#2f6a96", shadow)}
        {letters("#f4f6fb", 0)}
      </div>
    ),
    { width: size, height: size },
  );
}
