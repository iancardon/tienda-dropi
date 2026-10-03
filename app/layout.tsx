import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { STORE_CONFIG } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(STORE_CONFIG.url),
  title: {
    default: `${STORE_CONFIG.name} — Pago contra entrega`,
    template: `%s | ${STORE_CONFIG.name}`,
  },
  description: `Tienda online con pago contra entrega en toda Colombia. ${STORE_CONFIG.tagline}, sin pagos por adelantado.`,
  keywords: [
    "pago contra entrega",
    "comprar online Colombia",
    "envío contra entrega",
    "tienda online Colombia",
    STORE_CONFIG.name,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: STORE_CONFIG.url,
    siteName: STORE_CONFIG.name,
    title: `${STORE_CONFIG.name} — Pago contra entrega`,
    description: `Compra con pago contra entrega en toda Colombia. ${STORE_CONFIG.tagline}.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE_CONFIG.name} — Pago contra entrega`,
    description: `Compra con pago contra entrega en toda Colombia.`,
  },
};

/**
 * Layout raíz. Solo define el documento: no lleva cabecera ni pie para que el
 * panel de administración no herede la tienda. El esqueleto público vive en
 * `app/(tienda)/layout.tsx`.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}