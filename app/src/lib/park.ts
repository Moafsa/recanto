// Fonte única de verdade dos dados do parque (site, IA e cobrança usam este arquivo).

export const PARK = {
  name: "Recanto da Lagoa",
  city: "Flores da Cunha - RS",
  address: "Estrada Velha Caxias, 300, bairro São Cristóvão, Flores da Cunha - RS",
  cep: "95270-000",
  instagram: "https://www.instagram.com/recantodalagoars/",
  leo: { name: "Leo", phone: "5554991239491", display: "(54) 99123-9491" },
  openingDate: "2026-11-14",
  openingLabel: "14 de novembro de 2026",
  coords: { lat: -29.074867, lng: -51.171447 },
} as const;

export const TITLE_PLAN = {
  promoCents: 170000,
  normalCents: 240000,
  entryCents: 20000,
  promoLimit: 200,
  includes: ["Titular", "Cônjuge", "Filhos até 21 anos", "Pai e mãe", "Sogro e sogra"],
  // saldo negociável
  options: [
    { installments: 3, valueCents: 50000 },
    { installments: 6, valueCents: 28000 },
    { installments: 12, valueCents: 18000 },
  ],
} as const;

export const DAILY = {
  adultPix: 100, adultCash: 70,
  childPix: 40, childCash: 30,
  corkage: 150,
} as const;

export const HOURS = {
  days: "Quinta a segunda-feira",
  access: "08:00 às 18:30",
  pools: "09:00–12:00 e 14:00–18:00",
} as const;

export const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
