// Pasta em pixel (estilo Windows 3.1 / Mac System 1): contorno marrom, cantos cortados, sem gradiente.
const CORNER = "polygon(0 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%)";
const TAB = "polygon(0 0,78% 0,100% 100%,0 100%)";

export function PixelFolder({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative h-[50px] w-[64px] flex-none ${className}`}>
      <div className="absolute left-0 top-0 h-[12px] w-[28px] bg-[#7a5a10]" style={{ clipPath: TAB }} />
      <div className="absolute left-[3px] top-[3px] h-[9px] w-[21px] bg-[#ffe08a]" style={{ clipPath: TAB }} />
      <div className="absolute inset-x-0 bottom-0 top-[10px] bg-[#7a5a10]" style={{ clipPath: CORNER }} />
      <div className="absolute inset-x-[3px] bottom-[3px] top-[13px] bg-[#ffe08a]" style={{ clipPath: CORNER }} />
      <div className="absolute inset-x-[3px] top-[19px] h-[5px] bg-[#f0b93d]" />
    </div>
  );
}
