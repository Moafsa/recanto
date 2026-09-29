"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, MapPin } from "lucide-react";
import Image from "next/image";
import WaterCanvas from "./WaterCanvas";
import { pick } from "@/lib/photos";
import { Magnetic, SplitWords, ease } from "./ui";
import { PARK } from "@/lib/park";

function useCountdown(target: string) {
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    const end = new Date(`${target}T08:00:00-03:00`).getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setT({ d: Math.floor(diff / 864e5), h: Math.floor((diff / 36e5) % 24), m: Math.floor((diff / 6e4) % 60), s: Math.floor((diff / 1e3) % 60) });
    };
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, [target]);
  return t;
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const cd = useCountdown(PARK.openingDate);
  const [slots, setSlots] = useState<{ left: number; limit: number } | null>(null);
  useEffect(() => { fetch("/api/slots").then((r) => r.json()).then(setSlots).catch(() => setSlots({ left: 200, limit: 200 })); }, []);
  const pct = slots ? ((slots.limit - slots.left) / slots.limit) * 100 : 0;

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-gradient-to-b from-[#0a3a48] via-deep to-ink">
      <motion.div style={{ scale }} className="absolute inset-0"><WaterCanvas /></motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(3,20,27,.7),transparent_60%)]" />

      {/* sol */}
      <motion.div style={{ y }} className="pointer-events-none absolute right-[8%] top-[12%] hidden h-40 w-40 rounded-full bg-gradient-to-br from-sun to-coral blur-[2px] md:block">
        <div className="absolute inset-0 rounded-full bg-sun/60 blur-3xl" />
      </motion.div>


      {/* colagem de fotos reais */}
      <div className="pointer-events-none absolute right-[3%] top-[16%] z-[5] hidden h-[70%] w-[38%] xl:block">
        {[
          { src: pick("piscinas", 0), cls: "left-0 top-[6%] h-[38%] w-[62%] rotate-[-4deg]", d: 1.2 },
          { src: pick("infantil", 0), cls: "right-0 top-0 h-[52%] w-[40%] rotate-[3deg]", d: 1.5 },
          { src: pick("pedalinhos", 0), cls: "left-[8%] bottom-[2%] h-[40%] w-[36%] rotate-[2deg]", d: 1.8 },
          { src: pick("lagoa", 0), cls: "right-[4%] bottom-0 h-[38%] w-[52%] rotate-[-3deg]", d: 2.1 },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 60, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: c.d, duration: 1.2, ease }} className={`absolute ${c.cls}`}>
            <div className="floaty relative h-full w-full overflow-hidden rounded-3xl border-[3px] border-white/80 shadow-2xl shadow-black/50" style={{ animationDelay: `${i * -1.7}s` }}>
              <Image src={c.src} alt="" fill sizes="20vw" className="object-cover" priority={i < 2} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-36 sm:px-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease }}
          className="glass mb-8 inline-flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-xs font-semibold tracking-wide">
          <span className="relative grid h-6 w-6 place-items-center"><span className="absolute h-3 w-3 rounded-full bg-sun" /><span className="absolute h-3 w-3 rounded-full bg-sun" style={{ animation: "pulseRing 2s infinite" }} /></span>
          Pré-temporada aberta · reabertura {PARK.openingLabel}
        </motion.div>

        <h1 className="font-display text-[clamp(3.2rem,10.5vw,9.5rem)] font-light leading-[0.92] tracking-[-0.03em]">
          <SplitWords text="O verão" delay={0.6} /><br />
          <SplitWords text="da sua família" delay={0.85} className="italic" /><br />
          <span className="text-gradient font-medium"><SplitWords text="tem endereço." delay={1.15} /></span>
        </h1>

        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 1, ease }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-cream/75 sm:text-xl">
          Piscinas, toboáguas, pedalinhos, camping e churrasqueiras em meio à natureza de Flores da Cunha. Garanta o título de sócio antes da reabertura.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 1, ease }} className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic><a href="#socio" className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sun to-coral px-8 py-4 text-base font-bold text-ink shadow-2xl shadow-coral/30">Garantir meu título</a></Magnetic>
          <a href="#local" className="glass inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold transition hover:bg-white/10"><MapPin size={16} /> Flores da Cunha - RS</a>
        </motion.div>

        {/* contagem + vagas */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 1, ease }}
          className="mt-16 grid max-w-3xl gap-4 sm:grid-cols-[1.3fr_1fr]">
          <div className="glass rounded-3xl p-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-aqua">Abrimos em</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["d", "h", "m", "s"] as const).map((k, i) => (
                <div key={k}>
                  <div className="font-display text-4xl font-light tabular-nums sm:text-5xl">{cd ? String(cd[k]).padStart(2, "0") : "--"}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-cream/50">{["dias", "horas", "min", "seg"][i]}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sun">Lote promocional</span>
              <span className="font-display text-3xl font-medium text-sun">{slots ? slots.left : "—"}<span className="text-sm text-cream/50"> vagas</span></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.6, ease, delay: 2.3 }} className="h-full rounded-full bg-gradient-to-r from-sun to-coral" />
            </div>
            <div className="mt-2 text-xs text-cream/55">das {slots?.limit ?? 200} primeiras famílias</div>
          </div>
        </motion.div>
      </motion.div>

      <motion.a href="#marquee" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-cream/50 md:flex">
        Role <ArrowDown size={14} className="animate-bounce" />
      </motion.a>
    </section>
  );
}
