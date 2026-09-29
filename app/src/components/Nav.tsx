"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Magnetic, ease } from "./ui";

const links = [
  ["Atrações", "#atracoes"],
  ["Galeria", "#galeria"],
  ["Título de sócio", "#socio"],
  ["Horários", "#horarios"],
  ["Como chegar", "#local"],
  ["Dúvidas", "#faq"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease, delay: 0.2 }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-6"}`}
      >
        <div className={`mx-auto flex max-w-7xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-500 sm:px-7 ${scrolled ? "glass mx-3 max-w-6xl shadow-2xl shadow-black/30 sm:mx-auto" : ""}`}>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white shadow-lg shadow-black/30"><Image src="/fotos/logo.png" alt="Recanto da Lagoa" width={44} height={44} className="h-full w-full scale-[1.9] object-cover object-[8%_50%]" /></span>
            <span className="font-display text-xl font-semibold leading-none tracking-tight">Recanto<span className="text-aqua"> da Lagoa</span></span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {links.map(([l, h]) => (
              <a key={h} href={h} className="group relative text-sm font-medium text-cream/75 transition hover:text-white">
                {l}<span className="absolute -bottom-1 left-0 h-px w-0 bg-aqua transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/entrar" className="hidden text-sm font-semibold text-cream/80 transition hover:text-white sm:block">Entrar</Link>
            <Magnetic><a href="#socio" className="btn-shine rounded-full bg-gradient-to-r from-sun to-coral px-5 py-2.5 text-sm font-bold text-ink shadow-lg shadow-coral/25">Quero ser sócio</a></Magnetic>
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full glass lg:hidden" aria-label="Menu"><Menu size={18} /></button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ clipPath: "circle(0% at 92% 4%)" }} animate={{ clipPath: "circle(150% at 92% 4%)" }} exit={{ clipPath: "circle(0% at 92% 4%)" }} transition={{ duration: 0.7, ease }}
            className="fixed inset-0 z-[70] flex flex-col bg-deep p-8">
            <button onClick={() => setOpen(false)} className="ml-auto grid h-11 w-11 place-items-center rounded-full glass" aria-label="Fechar"><X size={20} /></button>
            <div className="mt-10 flex flex-col gap-5">
              {[...links, ["Entrar", "/entrar"]].map(([l, h], i) => (
                <motion.a key={h} href={h} onClick={() => setOpen(false)} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.07, ease }}
                  className="font-display text-4xl font-medium">{l}</motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
