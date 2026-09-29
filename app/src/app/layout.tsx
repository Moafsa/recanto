import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "opsz"], style: ["normal", "italic"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Recanto da Lagoa · Parque em Flores da Cunha",
  description:
    "Piscinas, toboáguas, pedalinhos, camping e churrasqueiras em meio à natureza. Reabertura em 14 de novembro de 2026. Garanta seu título de sócio.",
  openGraph: { title: "Recanto da Lagoa", description: "Diversão para toda a família em Flores da Cunha - RS.", locale: "pt_BR", type: "website" },
};
export const viewport: Viewport = { themeColor: "#03141b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
