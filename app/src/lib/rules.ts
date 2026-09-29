// Regras de dependentes (funciona no servidor e no navegador). A situação NUNCA é gravada:
// é calculada a cada tela a partir da data de nascimento, então muda sozinha quando o filho faz 22 anos.

/** Idade máxima (inclusive) de FILHO(A) no título. Pai, mãe, cônjuge e sogros não têm limite de idade. */
export const CHILD_MAX_AGE = 21;

export function onlyDigits(s?: string | null) { return (s ?? "").replace(/\D/g, ""); }

export function cpfValid(input?: string | null) {
  const c = onlyDigits(input);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (len: number) => {
    let sum = 0; for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11; return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

export function formatCpf(input?: string | null) {
  const c = onlyDigits(input).slice(0, 11);
  return c.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Idade em anos completos na data `at` (padrão: agora). */
export function ageOn(birth: Date | string | null | undefined, at: Date = new Date()): number | null {
  if (!birth) return null;
  const b = new Date(birth); if (isNaN(b.getTime())) return null;
  let a = at.getFullYear() - b.getUTCFullYear();
  const m = at.getMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && at.getDate() < b.getUTCDate())) a--;
  return a;
}

export type DepState = {
  age: number | null;
  blocked: boolean;        // filho(a) acima de 21 anos → sem acesso
  soon: boolean;           // filho(a) completa 22 anos em até 60 dias
  turnsBlockedOn: Date | null; // data em que passa a ser bloqueado
  missing: boolean;        // falta nascimento (filho sem data não dá para validar)
};

export function depState(dep: { relation: string; birthDate?: Date | string | null }, now: Date = new Date()): DepState {
  const age = ageOn(dep.birthDate, now);
  if (dep.relation !== "CHILD") return { age, blocked: false, soon: false, turnsBlockedOn: null, missing: false };
  if (age === null) return { age, blocked: false, soon: false, turnsBlockedOn: null, missing: true };
  const b = new Date(dep.birthDate as string);
  const turns = new Date(b.getUTCFullYear() + CHILD_MAX_AGE + 1, b.getUTCMonth(), b.getUTCDate());
  const blocked = age > CHILD_MAX_AGE;
  const soon = !blocked && (turns.getTime() - now.getTime()) / 86400000 <= 60;
  return { age, blocked, soon, turnsBlockedOn: turns, missing: false };
}

/** Valida a data de nascimento (yyyy-mm-dd): não pode ser futura nem absurda. */
export function birthValid(s?: string | null) {
  if (!s) return false;
  const d = new Date(s); if (isNaN(d.getTime())) return false;
  const a = ageOn(d);
  return a !== null && a >= 0 && a <= 110;
}

export const depInputError = (d: { name?: string; birthDate?: string | null; cpf?: string | null }) => {
  if (!d.name || d.name.trim().length < 2) return "Informe o nome do dependente";
  if (!birthValid(d.birthDate)) return `Data de nascimento inválida (${d.name})`;
  if (!cpfValid(d.cpf)) return `CPF inválido (${d.name})`;
  return null;
};
