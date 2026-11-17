import { renderIcon } from "@/lib/pwa-icon";

// Favicon da aba do navegador
export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(48);
}
