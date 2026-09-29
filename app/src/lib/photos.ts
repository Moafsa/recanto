import data from "./photos.json";

export type Photo = { src: string; w: number; h: number; cat: string };
export const photos = data as Record<keyof typeof data, { src: string; w: number; h: number }[]>;

export const catLabels: Record<string, string> = {
  piscinas: "Piscinas",
  toboagas: "Toboáguas",
  infantil: "Infláveis",
  pedalinhos: "Pedalinhos",
  lagoa: "Lagoa",
  areas: "Quiosques e áreas",
  brincar: "Playground",
  sede: "Sede",
};

export const allPhotos: Photo[] = Object.entries(photos).flatMap(([cat, list]) => list.map((p) => ({ ...p, cat })));
export const pick = (cat: keyof typeof data, i = 0) => photos[cat][i % photos[cat].length].src;
export const LOGO = "/fotos/logo.png";
