"use client";

import { FOLDER_ICONS, FOLDER_ICON_LABEL, type FolderIcon } from "@/lib/note-names";
import { FolderGlyph } from "./icons";

/**
 * Grade para escolher o ícone de uma pasta. "Automático" deixa o ícone ser sugerido pelo nome
 * (banco de dados, infra, docker...); qualquer outro é uma escolha fixa.
 */
export function IconPicker({
  value,
  suggested,
  onChange,
}: {
  /** Ícone escolhido; nulo = automático. */
  value: FolderIcon | null;
  /** O que o nome da pasta sugere (mostrado no botão "Automático"). */
  suggested: FolderIcon;
  onChange: (icon: FolderIcon | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={`flex items-center gap-2 border px-2 py-2 text-left text-xs max-md:py-3 max-md:text-sm ${
          value === null ? "border-[#19e6ff] bg-[#2b3544] text-white" : "border-[#3a4150] text-[#9fb6cc] hover:border-[#19e6ff]"
        }`}
      >
        <FolderGlyph name="x" icon={suggested} size={18} />
        <span>
          Automático <span className="text-[#6e7a8a]">· sugerido pelo nome: {FOLDER_ICON_LABEL[suggested]}</span>
        </span>
      </button>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Ícones de pasta">
        {FOLDER_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            title={FOLDER_ICON_LABEL[icon]}
            aria-label={FOLDER_ICON_LABEL[icon]}
            aria-pressed={value === icon}
            onClick={() => onChange(icon)}
            className={`flex h-10 flex-col items-center justify-center gap-0.5 border max-md:h-12 ${
              value === icon
                ? "border-[#19e6ff] bg-[#2b3544] shadow-[2px_2px_0_#0b0f14]"
                : "border-[#2f3744] hover:border-[#19e6ff]"
            }`}
          >
            <FolderGlyph name="x" icon={icon} size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
