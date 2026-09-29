"use client";
import { useEffect, useRef } from "react";

// Água interativa: ondas em camadas + ondulações que nascem sob o mouse/toque + partículas de luz.
export default function WaterCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, t = 0;
    const ripples: { x: number; y: number; r: number; a: number }[] = [];
    const motes = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.8 + 0.4, v: Math.random() * 0.00018 + 0.00004, p: Math.random() * 6 }));
    let lastRipple = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const addRipple = (clientX: number, clientY: number, force = false) => {
      const now = performance.now();
      if (!force && now - lastRipple < 90) return;
      lastRipple = now;
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: clientX - r.left, y: clientY - r.top, r: 0, a: 0.55 });
      if (ripples.length > 28) ripples.shift();
    };
    const onMove = (e: PointerEvent) => addRipple(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => { for (let i = 0; i < 3; i++) setTimeout(() => addRipple(e.clientX, e.clientY, true), i * 140); };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const layers = [
      { amp: 22, len: 0.0042, speed: 0.55, y: 0.60, c1: "rgba(25,195,176,.28)", c2: "rgba(6,43,54,.0)" },
      { amp: 30, len: 0.0031, speed: -0.4, y: 0.68, c1: "rgba(11,85,102,.55)", c2: "rgba(3,20,27,0)" },
      { amp: 18, len: 0.0058, speed: 0.75, y: 0.77, c1: "rgba(143,245,230,.16)", c2: "rgba(3,20,27,0)" },
      { amp: 26, len: 0.0036, speed: -0.6, y: 0.86, c1: "rgba(3,20,27,.85)", c2: "rgba(3,20,27,1)" },
    ];

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      t += reduce ? 0 : 0.016;
      ctx.clearRect(0, 0, w, h);

      // brilho do sol refletido
      const sun = ctx.createRadialGradient(w * 0.72, h * 0.22, 0, w * 0.72, h * 0.22, h * 0.7);
      sun.addColorStop(0, "rgba(255,200,87,.38)"); sun.addColorStop(0.35, "rgba(255,122,89,.12)"); sun.addColorStop(1, "rgba(255,200,87,0)");
      ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);

      // partículas de luz
      for (const m of motes) {
        m.y -= m.v * 16; if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
        const px = (m.x + Math.sin(t * 0.6 + m.p) * 0.012) * w, py = m.y * h;
        ctx.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(t + m.p));
        ctx.fillStyle = "#aef7ec";
        ctx.beginPath(); ctx.arc(px, py, m.s, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ondas
      for (const L of layers) {
        const base = h * L.y;
        const g = ctx.createLinearGradient(0, base - L.amp, 0, h);
        g.addColorStop(0, L.c1); g.addColorStop(1, L.c2);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) {
          let y = base + Math.sin(x * L.len * 2 + t * L.speed * 2) * L.amp + Math.sin(x * L.len * 4.3 - t * L.speed) * (L.amp * 0.35);
          // ondulações deformam a superfície
          for (const r of ripples) { const d = Math.abs(x - r.x); if (d < r.r + 60 && r.y > base - 120) y += Math.sin((d - r.r) * 0.08) * 9 * r.a * Math.exp(-d / 260); }
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
        // fio de luz na crista
        ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 1; ctx.stroke();
      }

      // anéis
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]; r.r += 2.6; r.a *= 0.965;
        if (r.a < 0.02) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(143,245,230,${r.a})`; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.38, 0, 0, 7); ctx.stroke();
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={ref} className={`absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
