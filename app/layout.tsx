import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { CartProvider } from "@/lib/cart";
import { CartLink } from "@/components/cart-badge";
import "./globals.css";
import { STORE_CONFIG, formatPhone, getSocialLinks } from "@/lib/store";

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
    "tienda dropshipping",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const socialLinks = getSocialLinks();
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <CartProvider>
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <Link href="/" className="leading-tight">
                <span className="block text-lg font-bold tracking-tight">
                  {STORE_CONFIG.name}
                </span>
                <span className="block text-[11px] font-medium text-zinc-500">
                  {STORE_CONFIG.tagline}
                </span>
              </Link>
              <nav className="flex items-center gap-6 text-sm font-medium">
                <Link href="/" className="transition hover:text-emerald-600">
                  Inicio
                </Link>
                <Link
                  href="/productos"
                  className="transition hover:text-emerald-600"
                >
                  Productos
                </Link>
                <CartLink />
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  Contra entrega
                </span>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 bg-zinc-50">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-lg font-bold">{STORE_CONFIG.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {STORE_CONFIG.tagline}. Pago contra entrega: pagas en
                    efectivo cuando recibes tu pedido.
                  </p>
                  <div className="mt-4 space-y-1 text-sm text-zinc-600">
                    <p>
                      <a
                        href={`mailto:${STORE_CONFIG.email}`}
                        className="transition hover:text-emerald-600"
                      >
                        {STORE_CONFIG.email}
                      </a>
                    </p>
                    <p>{formatPhone()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-800">Ayuda</p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                    <li>
                      <Link
                        href="/envios"
                        className="transition hover:text-emerald-600"
                      >
                        Envíos
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/cambios-y-devoluciones"
                        className="transition hover:text-emerald-600"
                      >
                        Cambios y devoluciones
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/terminos-y-condiciones"
                        className="transition hover:text-emerald-600"
                      >
                        Términos y condiciones
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/politica-de-privacidad"
                        className="transition hover:text-emerald-600"
                      >
                        Política de privacidad
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contacto"
                        className="transition hover:text-emerald-600"
                      >
                        Contacto
                      </Link>
                    </li>
                  </ul>
                </div>

                {socialLinks.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">
                      Síguenos
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                      {socialLinks.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition hover:text-emerald-600"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="mt-8 border-t border-zinc-200 pt-6 text-xs text-zinc-400">
                © {new Date().getFullYear()} {STORE_CONFIG.name}. Envíos en
                Colombia.
              </p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}