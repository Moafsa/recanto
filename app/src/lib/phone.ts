/** Normaliza para dígitos com DDI 55. Retorna null se inválido. */
export function normalizePhone(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = d.replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (!d.startsWith("55")) return d.length >= 11 && d.length <= 15 ? d : null;
  return d.length === 12 || d.length === 13 ? d : null;
}
