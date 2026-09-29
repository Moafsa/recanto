"use client";
import { motion, useInView, useMotionValue, useSpring, useTransform, useScroll, animate } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";

export const ease = [0.22, 1, 0.36, 1] as const;

/** Aparece ao entrar na tela. */
export function Reveal({ children, delay = 0, y = 40, className = "", once = true }: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Título com revelação palavra por palavra. */
export function SplitWords({ text, className = "", delay = 0, stagger = 0.07 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: "110%", rotate: 6 }}
            whileInView={{ y: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: delay + i * stagger, ease }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Texto que "acende" conforme o scroll. */
export function ScrollFill({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const s = i / words.length, e = s + 1 / words.length;
        return <Word key={i} progress={scrollYProgress} range={[s, e]}>{w}</Word>;
      })}
    </p>
  );
}
function Word({ children, progress, range }: { children: string; progress: any; range: [number, number] }) {
  const o = useTransform(progress, range, [0.14, 1]);
  return <motion.span style={{ opacity: o }} className="mr-[0.25em] inline-block">{children}</motion.span>;
}

/** Contador animado. */
export function Counter({ to, prefix = "", suffix = "", duration = 2, decimals = 0 }: { to: number; prefix?: string; suffix?: string; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease, onUpdate: (x) => setV(x) });
    return () => c.stop();
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

/** Botão magnético. */
export function Magnetic({ children, className = "", strength = 0.35 }: { children: ReactNode; className?: string; strength?: number }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 }), sy = useSpring(y, { stiffness: 220, damping: 16 });
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength); y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  return (
    <motion.div onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }} style={{ x: sx, y: sy }} className={`inline-block ${className}`}>
      {children}
    </motion.div>
  );
}

/** Card com inclinação 3D e holofote que segue o cursor. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 18 }), sry = useSpring(ry, { stiffness: 160, damping: 18 });
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 10); rx.set(-(py - 0.5) * 10); setPos({ x: px * 100, y: py * 100 });
  };
  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1100 }}
      className={`relative ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100"
        style={{ background: `radial-gradient(420px circle at ${pos.x}% ${pos.y}%, rgba(143,245,230,.16), transparent 45%)` }} />
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-aqua">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-aqua" />{children}
    </div>
  );
}
