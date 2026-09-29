"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { allPhotos, catLabels, photos, pick, type Photo } from "@/lib/photos";
import { Eyebrow, Reveal, SplitWords, ease } from "./ui";

/* ───────── lightbox ───────── */
function Lightbox({ list, index, onClose, onNav }: { list: Photo[]; index: number; onClose: () => void; onNav: (i: number) => void }) {
  const go = useCallback((d: number) => onNav((index + d + list.length) % list.length), [index, list.length, onNav]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [go, onClose]);
  const p = list[index];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-ink/95 backdrop-blur-xl" onClick={onClose}>
      <button onClick={onClose} className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full glass" aria-label="Fechar"><X /></button>
      <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 grid h-12 w-12 place-items-center rounded-full glass sm:left-8" aria-label="Anterior"><ChevronLeft /></button>
      <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 grid h-12 w-12 place-items-center rounded-full glass sm:right-8" aria-label="Próxima"><ChevronRight /></button>
      <AnimatePresence mode="wait">
        <motion.div key={p.src} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35, ease }}
          className="relative max-h-[84vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
          <Image src={p.src} alt={catLabels[p.cat]} width={p.w} height={p.h} className="max-h-[84vh] w-auto rounded-2xl object-contain shadow-2xl" priority />
          <div className="mt-3 flex justify-between text-xs text-cream/60"><span>{catLabels[p.cat]}</span><span>{index + 1} / {list.length}</span></div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ───────── galeria com filtros (mosaico) ───────── */
export function Gallery() {
  const [cat, setCat] = useState<string>("todas");
  const [open, setOpen] = useState<number | null>(null);
  const [limit, setLimit] = useState(18);
  const list = useMemo(() => (cat === "todas" ? allPhotos : allPhotos.filter((p) => p.cat === cat)), [cat]);
  const shown = list.slice(0, limit);
  const cats = ["todas", ...Object.keys(photos)];

  return (
    <section id="galeria" className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <Reveal><Eyebrow>Galeria</Eyebrow></Reveal>
      <h2 className="mb-10 max-w-3xl font-display text-[clamp(2.4rem,6vw,5rem)] font-light leading-[1] tracking-tight">
        <SplitWords text="Veja de" /> <span className="italic text-sun"><SplitWords text="pertinho." delay={0.2} /></span>
      </h2>
      <div className="mb-10 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => { setCat(c); setLimit(18); }} className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition ${cat === c ? "text-ink" : "border border-white/15 text-cream/70 hover:border-aqua/60"}`}>
            {cat === c && <motion.span layoutId="galPill" className="absolute inset-0 rounded-full bg-gradient-to-r from-aqua to-teal" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
            <span className="relative">{c === "todas" ? "Todas" : catLabels[c]}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        <AnimatePresence mode="popLayout">
          {shown.map((p, i) => (
            <motion.button key={p.src} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.5, ease, delay: Math.min(i, 8) * 0.03 }}
              onClick={() => setOpen(i)} className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl">
              <Image src={p.src} alt={catLabels[p.cat]} width={p.w} height={p.h} sizes="(max-width:640px) 50vw, 25vw" className="h-auto w-full transition duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
              <span className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-semibold opacity-0 transition duration-500 group-hover:opacity-100"><Expand size={13} />{catLabels[p.cat]}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
      {limit < list.length && (
        <div className="mt-10 text-center"><button onClick={() => setLimit(limit + 18)} className="glass rounded-full px-8 py-3.5 text-sm font-bold transition hover:bg-white/10">Ver mais fotos ({list.length - limit})</button></div>
      )}
      <AnimatePresence>{open !== null && <Lightbox list={list} index={open} onClose={() => setOpen(null)} onNav={setOpen} />}</AnimatePresence>
    </section>
  );
}

/* ───────── faixa horizontal presa ao scroll ───────── */
export function HorizontalReel() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-62%"]);
  const reel = [...photos.piscinas.slice(0, 3), ...photos.toboagas.slice(0, 2), ...photos.infantil.slice(0, 2), ...photos.pedalinhos.slice(0, 3), ...photos.lagoa.slice(0, 2)];
  return (
    <section ref={ref} className="relative h-[320vh] bg-ink">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mb-8 px-6 sm:px-10"><Eyebrow>Um passeio</Eyebrow>
          <h2 className="max-w-2xl font-display text-[clamp(2rem,5vw,4.2rem)] font-light leading-[1.02] tracking-tight">Do toboágua <span className="italic text-aqua">à beira da lagoa.</span></h2></div>
        <motion.div style={{ x }} className="flex w-max gap-5 px-6 sm:px-10">
          {reel.map((p, i) => (
            <div key={p.src} className={`relative shrink-0 overflow-hidden rounded-[2rem] border border-white/10 ${i % 2 ? "mt-10 h-[42vh] w-[52vw] sm:w-[34vw]" : "h-[50vh] w-[60vw] sm:w-[40vw]"}`}>
              <Image src={p.src} alt="" fill sizes="45vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
            </div>
          ))}
        </motion.div>
        <div className="mx-6 mt-10 h-px overflow-hidden rounded bg-white/10 sm:mx-10"><motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-aqua" /></div>
      </div>
    </section>
  );
}

/* ───────── faixa parallax da lagoa ───────── */
export function LagoaBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <section ref={ref} className="relative isolate my-10 h-[70vh] overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[14%]"><Image src={pick("lagoa", 0)} alt="Lagoa do parque" fill sizes="100vw" className="object-cover" /></motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/20 to-ink" />
      <div className="relative z-10 grid h-full place-items-center px-6 text-center">
        <p className="max-w-3xl font-display text-[clamp(2rem,5.5vw,4.6rem)] font-light italic leading-[1.05]">“Onde a água, o pinheiral e a família se encontram.”</p>
      </div>
    </section>
  );
}
