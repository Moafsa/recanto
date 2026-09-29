// Rótulos em português para os códigos internos (banco/API continuam em inglês).
export const leadStatus: Record<string, string> = { NEW: "Novo", CONTACTED: "Contatado", NEGOTIATING: "Em negociação", WON: "Fechado", LOST: "Perdido" };
export const titleStatus: Record<string, string> = { PENDING: "Aguardando entrada", ACTIVE: "Ativo", OVERDUE: "Em atraso", CANCELLED: "Cancelado" };
export const payStatus: Record<string, string> = { PENDING: "Pendente", RECEIVED: "Pago", OVERDUE: "Vencido", REFUNDED: "Estornado", CANCELLED: "Cancelado" };
export const source: Record<string, string> = { SITE: "Site", WHATSAPP: "WhatsApp", CHAT: "Chat do site", INSTAGRAM: "Instagram", MANUAL: "Manual" };
export const interest: Record<string, string> = { TITULO: "Título de sócio", DIARIA: "Diária", FESTA: "Salão de festas", CAMPING: "Camping", OUTRO: "Outro" };
export const lot: Record<string, string> = { PROMO: "Promocional", NORMAL: "Normal" };
export const channel: Record<string, string> = { SITE: "Site", PAINEL: "Painel do sócio", WHATSAPP: "WhatsApp" };
export const billing: Record<string, string> = { MANUAL: "Manual", PIX: "PIX", BOLETO: "Boleto", UNDEFINED: "Asaas (PIX/boleto)" };
export const relation: Record<string, string> = { SPOUSE: "Cônjuge", CHILD: "Filho(a)", FATHER: "Pai", MOTHER: "Mãe", IN_LAW: "Sogro(a)" };
export const payKind = (kind: string, n: number, total: number) => (kind === "ENTRY" ? "Entrada" : `Parcela ${n} de ${total}`);
export const L = (map: Record<string, string>, k?: string | null) => (k ? map[k] ?? k : "—");

export const statusTone: Record<string, string> = {
  ACTIVE: "bg-teal/25 text-aqua", RECEIVED: "bg-teal/25 text-aqua", WON: "bg-teal/25 text-aqua",
  PENDING: "bg-sun/20 text-sun", NEW: "bg-sun/20 text-sun", CONTACTED: "bg-aqua/15 text-aqua", NEGOTIATING: "bg-sun/20 text-sun",
  OVERDUE: "bg-coral/25 text-coral", LOST: "bg-coral/20 text-coral",
  CANCELLED: "bg-white/10 text-cream/50", REFUNDED: "bg-white/10 text-cream/50",
};
