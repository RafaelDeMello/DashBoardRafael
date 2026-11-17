// Janela retrô: faixa clara com título preto, moldura azul-petróleo fina e sombra dura.
// É a linguagem visual das telas Configurações, Modelos e Acessos (a mesma da faixa do dia).

export const winInput =
  "w-full rounded-none border border-[#9fb0c3] bg-white px-2.5 py-1.5 text-sm text-[#37352f] outline-none transition " +
  "placeholder:text-[#b4b2ad] focus:border-[#2f6a96] focus:shadow-[2px_2px_0_#2f6a96] max-md:text-base";

export const winLabel = "font-retro text-[15px] uppercase tracking-[0.12em] text-[#787774]";

/** Botão principal: azul-escuro com sombra dura que "afunda" ao clicar. */
export const btnPrimary =
  "rounded-none border border-[#2f6a96] bg-[#16283d] px-3 py-1.5 text-xs text-[#dfe6f5] shadow-[3px_3px_0_#08121f] transition " +
  "hover:bg-[#1d3652] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#08121f] disabled:cursor-wait disabled:opacity-60";

export const btnGhost =
  "rounded-none border border-[#16283d] bg-white px-3 py-1.5 text-xs text-[#16283d] transition hover:bg-[#f4f7fa] disabled:cursor-wait disabled:opacity-60";

export function Win({
  title,
  squares = true,
  className = "",
  children,
}: {
  /** Texto (ou elemento) do título; o ">" é acrescentado aqui. */
  title: React.ReactNode;
  squares?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`border border-[#16283d] bg-white text-[#37352f] shadow-[3px_3px_0_#16283d] ${className}`}
    >
      <div className="flex h-[22px] items-center justify-between border-b border-[#16283d] bg-[#f4f7fa] px-2.5 font-retro text-[17px] uppercase tracking-[0.18em] text-[#1a1a18]">
        <span className="min-w-0 truncate">
          <span aria-hidden>&gt; </span>
          {title}
        </span>
        {squares && (
          <span aria-hidden className="flex flex-none gap-[3px]">
            <span className="h-1.5 w-1.5 bg-[#19e6ff]" />
            <span className="h-1.5 w-1.5 border border-[#16283d] bg-white" />
            <span className="h-1.5 w-1.5 bg-[#3a4150]" />
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
