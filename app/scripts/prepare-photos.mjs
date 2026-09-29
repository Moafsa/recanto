// Copia/otimiza as fotos escolhidas de C:\Users\moaci\Downloads\Recanto para public/fotos (webp).
// Índices = ordem numérica dos arquivos (images.jpg=0 é a logo).
import sharp from "sharp";
import fs from "fs";
import crypto from "crypto";

const SRC = process.argv[2] || "C:/Users/moaci/Downloads/Recanto";
const OUT = "public/fotos";
const files = fs.readdirSync(SRC).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort((a, b) => {
  const n = (s) => +(s.match(/\((\d+)\)/) || [0, 0])[1];
  return n(a) - n(b) || a.localeCompare(b);
});

const cats = {
  piscinas: [87, 19, 3, 39, 44, 53, 56, 71, 76, 84, 88, 89, 90, 91, 72, 2],
  toboagas: [54, 67, 77, 69, 74, 49],
  infantil: [16, 26, 31, 33, 43, 27, 8],
  pedalinhos: [48, 7, 14, 42, 61, 66, 81, 50],
  lagoa: [10, 6, 9, 34, 82, 4],
  areas: [46, 62, 64, 45, 12, 63, 55, 75, 13, 21, 68, 73, 18],
  brincar: [58, 78],
  sede: [5, 22, 41, 60, 80, 37, 25],
};

const seen = new Map();
const manifest = {};
for (const [cat, idxs] of Object.entries(cats)) {
  manifest[cat] = [];
  let n = 1;
  for (const i of idxs) {
    const buf = fs.readFileSync(`${SRC}/${files[i]}`);
    const h = crypto.createHash("md5").update(buf).digest("hex");
    if (seen.has(h)) continue; seen.set(h, 1);
    const name = `${cat}-${String(n++).padStart(2, "0")}.webp`;
    const img = sharp(buf);
    const m = await img.metadata();
    await img.webp({ quality: 88 }).toFile(`${OUT}/${name}`);
    manifest[cat].push({ src: `/fotos/${name}`, w: m.width, h: m.height });
  }
}
// logo
await sharp(`${SRC}/${files[0]}`).png().toFile(`${OUT}/logo.png`);
await sharp(`${SRC}/${files[0]}`).resize(256, 256, { fit: "contain", background: "#fff" }).png().toFile("src/app/icon.png");
fs.writeFileSync("src/lib/photos.json", JSON.stringify(manifest, null, 1));
console.log(Object.entries(manifest).map(([k, v]) => `${k}: ${v.length}`).join(" | "), "| logo:", files[0]);
