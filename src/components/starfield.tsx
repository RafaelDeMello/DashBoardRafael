"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number; // raio
  a: number; // brilho base (0..1)
  speed: number; // velocidade do brilho pulsando
  phase: number;
  vy: number; // deriva vertical (estrelas maiores = mais "perto" = mais rápidas)
  rgb: string;
};
type Shooting = { x: number; y: number; vx: number; vy: number; life: number };

// Estrelas acinzentadas: cinzas, branco-acinzentado e um azul bem desbotado (quase cinza)
const PALETTE = [
  "200,204,214",
  "200,204,214",
  "168,173,188",
  "168,173,188",
  "140,146,162",
  "140,146,162",
  "226,228,236",
  "255,255,255",
  "150,164,190",
];

/** Fundo de espaço: nebulosas (CSS) + estrelas animadas (canvas). */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let shooting: Shooting | null = null;
    let nextShootingAt = performance.now() + 5000;
    let last = performance.now();
    let raf = 0;

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Bastante estrelas, mas todas acinzentadas
      const count = Math.min(300, Math.floor((width * height) / 5500));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random() ** 2; // maioria pequena e distante
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.35 + depth * 1.5,
          a: 0.2 + depth * 0.55,
          speed: 0.5 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
          vy: -(0.004 + depth * 0.018),
          rgb: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        };
      });
    }

    function frame(now: number) {
      const dt = Math.min(now - last, 50);
      last = now;
      ctx!.clearRect(0, 0, width, height);

      for (const s of stars) {
        if (!reduceMotion) {
          s.y += s.vy * dt;
          if (s.y < -2) {
            s.y = height + 2;
            s.x = Math.random() * width;
          }
        }
        const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(now * 0.001 * s.speed + s.phase);
        const alpha = s.a * twinkle;

        ctx!.fillStyle = `rgba(${s.rgb},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();

        if (s.r > 1.25) {
          // halo suave nas estrelas maiores
          ctx!.fillStyle = `rgba(${s.rgb},${alpha * 0.14})`;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      if (!reduceMotion) {
        if (!shooting && now > nextShootingAt) {
          const fromLeft = Math.random() > 0.5;
          shooting = {
            x: fromLeft ? Math.random() * width * 0.5 : width * 0.5 + Math.random() * width * 0.5,
            y: Math.random() * height * 0.4,
            vx: (fromLeft ? 1 : -1) * (0.55 + Math.random() * 0.25),
            vy: 0.22 + Math.random() * 0.12,
            life: 1,
          };
        }
        if (shooting) {
          shooting.x += shooting.vx * dt;
          shooting.y += shooting.vy * dt;
          shooting.life -= dt / 900;
          const tailX = shooting.x - shooting.vx * 140;
          const tailY = shooting.y - shooting.vy * 140;
          const grad = ctx!.createLinearGradient(tailX, tailY, shooting.x, shooting.y);
          grad.addColorStop(0, "rgba(168,188,232,0)");
          grad.addColorStop(1, `rgba(226,234,255,${Math.max(shooting.life, 0) * 0.9})`);
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 1.4;
          ctx!.beginPath();
          ctx!.moveTo(tailX, tailY);
          ctx!.lineTo(shooting.x, shooting.y);
          ctx!.stroke();
          if (shooting.life <= 0) {
            shooting = null;
            nextShootingAt = now + 9000 + Math.random() * 9000;
          }
        }
        raf = requestAnimationFrame(frame);
      }
    }

    function onResize() {
      build();
      if (reduceMotion) frame(performance.now());
    }

    build();
    frame(performance.now());
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <div className="space-bg" aria-hidden />
      <div className="scanlines" aria-hidden />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
    </>
  );
}
