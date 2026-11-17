import { renderIcon } from "@/lib/pwa-icon";

// Ícone da tela inicial do iPhone/iPad
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(180);
}
