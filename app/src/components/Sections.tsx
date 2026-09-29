"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { pick } from "@/lib/photos";
import { Waves, Ship, Tent, Flame, PartyPopper, Trees, Clock, ShieldCheck, Plus, Minus, Navigation, Camera, Phone, Check, Users, Baby, Sparkles } from "lucide-react";
import { Counter, Eyebrow, Reveal, ScrollFill, SplitWords, TiltCard, Magnetic, ease } from "./ui";
import { PARK, TITLE_PLAN, DAILY, HOURS, brl } from "@/lib/park";

/* ───────── faixa rolante ───────── */
export function Marquee() {
  const items = ["Piscinas", "Toboáguas", "Pedalinhos", "Camping", "Churrasqueiras", "Salão de festas", "Natureza", "Família"];
  const row = [...items, ...items];
  return (
    <section id="marquee" className="relative -mt-1 overflow-hidden border-y border-white/10 bg-deep py-6">
      <div className="marquee-track flex gap-12">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap font-display text-4xl font-light italic text-cream/85 sm:text-6xl">
            {t}<Sparkles className="text-sun" size={26} />
          </span>
        ))}
      </div>
    </section>
  );
}

/* ───────── manifesto ───────── */
export function Manifesto() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-32 sm:px-10 sm:py-44">
      <Eyebrow>O parque</Eyebrow>
      <ScrollFill
        className="font-display text-[clamp(1.9rem,4.6vw,4rem)] font-light leading-[1.15] tracking-tight"
        text="Um recanto pensado para reunir a família inteira: crianças nos toboáguas, avós na sombra, o churrasco no ponto e a lagoa ao fundo. Um lugar para voltar todo fim de semana."
      />
    </section>
  );
}

/* ───────── atrações (bento) ───────── */
const attractions = [
  { icon: Waves, title: "Piscinas & toboáguas", text: "Piscinas e toboáguas para a família toda. Piscinas abertas das 9h às 12h e das 14h às 18h.", span: "md:col-span-2 md:row-span-2", grad: "from-teal/40 via-lagoon/60 to-deep", big: true, img: pick("piscinas", 0) },
  { icon: Ship, title: "Pedalinhos", text: "R$ 20 por 20 minutos. Cabem 2 adultos e 1 criança.", span: "", grad: "from-sun/30 via-coral/20 to-deep", img: pick("pedalinhos", 0) },
  { icon: Flame, title: "Quiosques de churrasco", text: "Locação de R$ 50 a R$ 100, com churrasqueira.", span: "", grad: "from-coral/35 via-lagoon/30 to-deep", img: pick("areas", 0) },
  { icon: Tent, title: "Camping", text: "Exclusivo para sócios e para grupos com lista prévia. R$ 20 por pessoa/dia.", span: "", grad: "from-aqua/25 via-teal/25 to-deep", img: pick("areas", 4) },
  { icon: PartyPopper, title: "Salão de festas", text: "Até 120 pessoas sentadas, com churrasqueira, fogão, geladeira e pia. Sob orçamento.", span: "md:col-span-2", grad: "from-sun/25 via-lagoon/40 to-deep", img: pick("sede", 3) },
  { icon: Trees, title: "Em meio à natureza", text: "Estrada Velha Caxias, bairro São Cristóvão, a cerca de 5 km do centro.", span: "", grad: "from-teal/30 via-deep to-ink", img: pick("lagoa", 1) },
];

export function Attractions() {
  return (
    <section id="atracoes" className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <Reveal><Eyebrow>Atrações</Eyebrow></Reveal>
      <h2 className="mb-14 max-w-3xl font-display text-[clamp(2.4rem,6vw,5rem)] font-light leading-[1] tracking-tight">
        <SplitWords text="Tudo num só" /> <span className="italic text-aqua"><SplitWords text="recanto." delay={0.3} /></span>
      </h2>
      <div className="grid auto-rows-[minmax(230px,auto)] gap-4 md:grid-cols-4">
        {attractions.map((a, i) => (
          <Reveal key={a.title} delay={i * 0.07} className={a.span}>
            <TiltCard className="h-full">
              <div className={`group relative flex h-full min-h-[230px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${a.grad} p-7`}>
                <Image src={a.img} alt={a.title} fill sizes="(max-width:768px) 100vw, 40vw" className="absolute inset-0 object-cover transition duration-[1200ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
                <a.icon className={`relative text-aqua transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6 ${a.big ? "h-14 w-14" : "h-9 w-9"}`} strokeWidth={1.4} />
                <div className="relative">
                  <h3 className={`font-display font-medium tracking-tight ${a.big ? "text-4xl sm:text-5xl" : "text-2xl"}`}>{a.title}</h3>
                  <p className={`mt-3 leading-relaxed text-cream/70 ${a.big ? "max-w-md text-lg" : "text-sm"}`}>{a.text}</p>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── números ───────── */
export function Stats() {
  const s = [
    { n: 120, l: "pessoas sentadas no salão", suf: "" },
    { n: 5, l: "dias por semana, de quinta a segunda", suf: "" },
    { n: 200, l: "famílias no lote promocional", suf: "" },
    { n: 20, l: "minutos de pedalinho", suf: " min" },
  ];
  return (
    <section className="border-y border-white/10 bg-gradient-to-b from-deep to-ink">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-6 py-20 sm:px-10 lg:grid-cols-4">
        {s.map((x, i) => (
          <Reveal key={x.l} delay={i * 0.1} className="border-l border-white/10 pl-6">
            <div className="text-gradient font-display text-6xl font-light sm:text-7xl"><Counter to={x.n} suffix={x.suf} /></div>
            <div className="mt-2 max-w-[14rem] text-sm text-cream/60">{x.l}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── título de sócio + calculadora ───────── */
export function Membership() {
  const [inst, setInst] = useState<3 | 6 | 12>(3);
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(2);
  const opt = TITLE_PLAN.options.find((o) => o.installments === inst)!;
  const total = TITLE_PLAN.entryCents + opt.installments * opt.valueCents;
  const perVisit = adults * DAILY.adultPix + kids * DAILY.childPix;
  const breakeven = Math.max(1, Math.ceil(TITLE_PLAN.promoCents / 100 / Math.max(perVisit, 1)));

  return (
    <section id="socio" className="relative overflow-hidden bg-gradient-to-b from-ink via-deep to-ink py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-teal/15 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal><Eyebrow>Título de sócio · pré-temporada</Eyebrow></Reveal>
        <h2 className="mb-16 max-w-4xl font-display text-[clamp(2.4rem,6vw,5.2rem)] font-light leading-[1] tracking-tight">
          <SplitWords text="Uma vez sócio," /> <span className="italic text-sun"><SplitWords text="a família toda entra." delay={0.3} /></span>
        </h2>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* cartão do título */}
          <Reveal>
            <TiltCard className="rounded-[2.2rem]">
              <div className="relative overflow-hidden rounded-[2.2rem] border border-white/15 bg-gradient-to-br from-lagoon via-deep to-ink p-8 sm:p-10">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sun/25 blur-3xl" />
                <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 14px)" }} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-aqua">Título familiar</div>
                    <div className="mt-1 font-display text-2xl italic text-cream/80">Recanto da Lagoa</div>
                  </div>
                  <span className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink">LOTE PROMO</span>
                </div>
                <div className="relative mt-10">
                  <div className="text-sm text-cream/50 line-through">{brl(TITLE_PLAN.normalCents)}</div>
                  <div className="font-display text-[clamp(3.5rem,9vw,6.5rem)] font-light leading-none tracking-tight text-gradient">
                    R$ <Counter to={1700} duration={2.2} />
                  </div>
                  <div className="mt-2 text-sm text-cream/60">para as {TITLE_PLAN.promoLimit} primeiras famílias</div>
                </div>
                <ul className="relative mt-8 grid gap-2.5 sm:grid-cols-2">
                  {TITLE_PLAN.includes.map((t) => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-cream/85"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal/25 text-aqua"><Check size={12} strokeWidth={3} /></span>{t}</li>
                  ))}
                </ul>

                {/* parcelas */}
                <div className="relative mt-9">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-cream/50">Entrada de {brl(TITLE_PLAN.entryCents)} + saldo em</div>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/25 p-1.5">
                    {TITLE_PLAN.options.map((o) => (
                      <button key={o.installments} onClick={() => setInst(o.installments as 3 | 6 | 12)}
                        className={`relative rounded-xl px-2 py-3 text-center transition ${inst === o.installments ? "text-ink" : "text-cream/70 hover:text-white"}`}>
                        {inst === o.installments && <motion.span layoutId="instPill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-aqua to-teal" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                        <span className="relative block text-lg font-bold">{o.installments}x</span>
                        <span className="relative block text-xs">{brl(o.valueCents)}</span>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p key={inst} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-cream/60">
                      Total no plano escolhido: <b className="text-cream">{brl(total)}</b>
                    </motion.p>
                  </AnimatePresence>
                </div>

                <Magnetic className="relative mt-9 w-full">
                  <a href="/entrar?next=/painel/titulo" className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sun to-coral py-4 text-base font-bold text-ink shadow-2xl shadow-coral/30">Quero meu título</a>
                </Magnetic>
              </div>
            </TiltCard>
          </Reveal>

          {/* calculadora */}
          <Reveal delay={0.15}>
            <div className="glass h-full rounded-[2.2rem] p-8 sm:p-10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sun">Vale a pena?</div>
              <h3 className="mt-2 font-display text-3xl font-light leading-tight sm:text-4xl">Compare com a diária avulsa</h3>
              <div className="mt-8 space-y-6">
                <Slider icon={<Users size={16} />} label="Adultos" value={adults} set={setAdults} max={8} min={1} />
                <Slider icon={<Baby size={16} />} label="Crianças" value={kids} set={setKids} max={8} min={0} />
              </div>
              <div className="mt-8 rounded-2xl bg-black/25 p-6">
                <div className="text-sm text-cream/60">Uma visita sem título (PIX)</div>
                <div className="font-display text-5xl font-light">{brl(perVisit * 100)}</div>
                <div className="mt-5 text-sm text-cream/60">O título de {brl(TITLE_PLAN.promoCents)} se paga em</div>
                <div className="text-gradient font-display text-6xl font-light leading-none">
                  {breakeven} <span className="text-2xl">{breakeven === 1 ? "visita" : "visitas"}</span>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-cream/45">Cálculo com diária de {brl(DAILY.adultPix * 100)} (adulto) e {brl(DAILY.childPix * 100)} (criança) no PIX. Sócios também têm acesso ao camping (R$ 20 por pessoa/dia).</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* diárias */}
        <Reveal delay={0.1} className="mt-6">
          <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[.03] p-6 sm:grid-cols-4 sm:p-8">
            <div className="sm:col-span-1"><div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-aqua">Não é sócio?</div><div className="mt-1 font-display text-2xl">Diária avulsa</div></div>
            {[["Adulto", DAILY.adultPix, DAILY.adultCash], ["Criança", DAILY.childPix, DAILY.childCash]].map(([l, p, c]) => (
              <div key={String(l)}><div className="text-sm text-cream/55">{l}</div><div className="font-display text-3xl">{brl(Number(p) * 100)} <span className="text-xs text-cream/50">PIX</span></div><div className="text-sm text-cream/60">{brl(Number(c) * 100)} em dinheiro</div></div>
            ))}
            <div><div className="text-sm text-cream/55">Taxa de rolha</div><div className="font-display text-3xl">{brl(DAILY.corkage * 100)}</div><div className="text-xs text-cream/50">só se levar suas bebidas</div></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Slider({ icon, label, value, set, min, max }: { icon: React.ReactNode; label: string; value: number; set: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-cream/70">{icon}{label}</span><span className="font-display text-2xl">{value}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-[#19c3b0]" />
    </div>
  );
}

/* ───────── horários + regras ───────── */
export function Hours() {
  const steps = [
    { t: "08:00", d: "Portões abertos", icon: Clock },
    { t: "09:00", d: "Piscinas liberadas", icon: Waves },
    { t: "12:00", d: "Pausa das piscinas", icon: Flame },
    { t: "14:00", d: "Piscinas reabrem", icon: Waves },
    { t: "18:00", d: "Piscinas encerram", icon: Clock },
    { t: "18:30", d: "Saída do parque", icon: Clock },
  ];
  return (
    <section id="horarios" className="mx-auto max-w-7xl px-6 py-32 sm:px-10">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Reveal><Eyebrow>Funcionamento</Eyebrow></Reveal>
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,4.6rem)] font-light leading-[1] tracking-tight"><SplitWords text="Quinta a segunda," /><br /><span className="italic text-aqua"><SplitWords text="o dia todo." delay={0.25} /></span></h2>
          <p className="mt-6 max-w-md text-cream/65">{HOURS.days}, a partir de {PARK.openingLabel}. Acesso das {HOURS.access}. Piscinas: {HOURS.pools}.</p>
          <Reveal delay={0.2} className="mt-10">
            <div className="glass rounded-3xl p-6">
              <div className="mb-2 flex items-center gap-2 text-sun"><ShieldCheck size={18} /><b className="text-sm uppercase tracking-widest">Ambiente familiar</b></div>
              <p className="text-sm leading-relaxed text-cream/70">O parque preza estritamente pelo ambiente familiar. Em caso de falta de postura, o visitante é advertido uma única vez. Na segunda ocorrência, a administração aciona a Guarda Civil Municipal para a retirada imediata.</p>
            </div>
          </Reveal>
        </div>
        <div className="relative">
          <div className="absolute bottom-3 left-[27px] top-3 w-px bg-gradient-to-b from-aqua/70 via-teal/30 to-transparent" />
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08} y={24} className="relative mb-4 flex items-center gap-6">
              <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-aqua/40 bg-deep text-aqua"><s.icon size={20} /></span>
              <div className="glass flex flex-1 items-baseline justify-between gap-4 rounded-2xl px-6 py-4">
                <span className="font-display text-3xl font-light tabular-nums">{s.t}</span><span className="text-right text-sm text-cream/70">{s.d}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── localização ───────── */
export function Location() {
  return (
    <section id="local" className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
      <div className="grid overflow-hidden rounded-[2.4rem] border border-white/10 bg-gradient-to-br from-deep to-ink lg:grid-cols-2">
        <div className="p-8 sm:p-14">
          <Reveal><Eyebrow>Como chegar</Eyebrow></Reveal>
          <h2 className="font-display text-4xl font-light leading-tight sm:text-5xl">Flores da Cunha,<br /><span className="italic text-aqua">Serra Gaúcha.</span></h2>
          <p className="mt-6 text-cream/70">{PARK.address}<br />CEP {PARK.cep}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${PARK.coords.lat},${PARK.coords.lng}`} target="_blank" className="btn-shine inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-aqua to-teal px-6 py-3 text-sm font-bold text-ink"><Navigation size={16} /> Abrir rota</a>
            <a href={PARK.instagram} target="_blank" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"><Camera size={16} /> @recantodalagoars</a>
            <a href={`https://wa.me/${PARK.leo.phone}`} target="_blank" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"><Phone size={16} /> {PARK.leo.name} · {PARK.leo.display}</a>
          </div>
        </div>
        <div className="relative min-h-[320px] bg-lagoon/30">
          <iframe title="Mapa" className="absolute inset-0 h-full w-full grayscale-[.4] contrast-110 invert-[.92] hue-rotate-[170deg]" loading="lazy"
            src={`https://maps.google.com/maps?q=${PARK.coords.lat},${PARK.coords.lng}&z=15&output=embed`} />
        </div>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
const faqs = [
  ["Quem entra com o título de sócio?", "Titular, cônjuge, filhos até 21 anos, pai, mãe e sogros."],
  ["Como funciona o pagamento do título?", `Entrada de ${brl(TITLE_PLAN.entryCents)} e saldo negociável: 3x de R$ 500, 6x de R$ 280 ou 12x de R$ 180. Você recebe as cobranças por PIX ou boleto.`],
  ["Até quando vale o valor promocional?", `${brl(TITLE_PLAN.promoCents)} vale apenas para as ${TITLE_PLAN.promoLimit} primeiras famílias. Depois, o título passa a ${brl(TITLE_PLAN.normalCents)}.`],
  ["Posso levar bebida?", `Pode, com taxa de rolha de ${brl(DAILY.corkage * 100)}, aplicada apenas a quem levar as próprias bebidas.`],
  ["O camping é aberto a todos?", "O uso regular é exclusivo para sócios (R$ 20 por pessoa/dia). Grupos como empresas, igrejas, associações e escoteiros podem locar, com envio prévio da lista de participantes — fale com o Leo."],
  ["Como faço orçamento do salão de festas?", `O salão comporta até 120 pessoas sentadas. Os valores são sob orçamento com o ${PARK.leo.name}: ${PARK.leo.display}.`],
];
export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 pb-32 sm:px-10">
      <Reveal><Eyebrow>Dúvidas</Eyebrow></Reveal>
      <h2 className="mb-12 font-display text-4xl font-light sm:text-6xl">Perguntas frequentes</h2>
      <div className="divide-y divide-white/10 border-y border-white/10">
        {faqs.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left">
              <span className="font-display text-xl sm:text-2xl">{q}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-aqua">{open === i ? <Minus size={16} /> : <Plus size={16} />}</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                  <p className="pb-6 pr-14 leading-relaxed text-cream/65">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── captação de leads ───────── */
export function LeadForm() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState("loading");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), phone: f.get("phone"), email: f.get("email") || "", interest: "TITULO" }) });
    if (r.ok) setState("ok"); else { setErr((await r.json()).error || "Erro"); setState("err"); }
  }
  const field = "w-full rounded-2xl border border-white/15 bg-black/25 px-5 py-4 text-base outline-none transition placeholder:text-cream/35 focus:border-aqua focus:bg-black/40";
  return (
    <section className="relative overflow-hidden px-6 pb-32 sm:px-10">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.6rem] border border-white/15 bg-gradient-to-br from-lagoon to-deep p-8 sm:p-16">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-teal/30 blur-3xl" /><div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-sun/20 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-light leading-tight sm:text-6xl">Garanta sua vaga <span className="text-gradient italic">na pré-temporada.</span></h2>
            <p className="mt-5 text-cream/70">Deixe seu WhatsApp e a Pérola, nossa assistente, entra em contato com todos os detalhes.</p>
          </div>
          {state === "ok" ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass grid place-items-center rounded-3xl p-10 text-center">
              <div><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-teal text-ink"><Check size={30} strokeWidth={3} /></div><div className="font-display text-3xl">Recebemos!</div><p className="mt-2 text-cream/65">Em breve você recebe uma mensagem no WhatsApp.</p></div>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input name="name" required placeholder="Seu nome" className={field} />
              <input name="phone" required placeholder="WhatsApp com DDD" inputMode="tel" className={field} />
              <input name="email" type="email" placeholder="E-mail (opcional)" className={field} />
              {state === "err" && <p className="text-sm text-coral">{err}</p>}
              <button disabled={state === "loading"} className="btn-shine w-full rounded-full bg-gradient-to-r from-sun to-coral py-4 text-base font-bold text-ink disabled:opacity-60">{state === "loading" ? "Enviando…" : "Quero ser sócio"}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 pt-20">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 pb-10 text-sm text-cream/55 sm:flex-row sm:px-10">
        <div className="flex items-center gap-4"><Image src="/fotos/logo.png" alt="Recanto da Lagoa" width={72} height={72} className="rounded-2xl bg-white" /><div>© {new Date().getFullYear()} Parque e Camping Recanto da Lagoa · Flores da Cunha - RS<br />{PARK.address}</div></div>
        <div className="flex gap-6"><a href={PARK.instagram} target="_blank" className="hover:text-aqua">Instagram</a><a href="/entrar" className="hover:text-aqua">Área do sócio</a></div>
      </div>
      <div className="pointer-events-none select-none whitespace-nowrap text-center font-display text-[19vw] font-light italic leading-[0.8] text-white/[.04]">Recanto</div>
    </footer>
  );
}
