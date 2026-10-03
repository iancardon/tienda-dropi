import Link from "next/link";
import type { Route } from "next";
import { IconCart, IconMenu, IconSearch, IconWhatsApp } from "@/components/icons";
import { CartLink } from "@/components/cart-badge";
import { STORE_CONFIG, getWhatsAppUrl } from "@/lib/store";

/**
 * Cabecera de la tienda.
 *
 * Va fija al hacer scroll en escritorio y en móvil. En pantallas grandes se
 * ve la navegación completa; por debajo de `md` se colapsa en un menú que
 * ocupa la pantalla. Se mantiene el enlace al carrito en ambos casos para que
 * nunca haya que abrir el menú para añadir algo.
 */
export function SiteHeader({ categories }: { categories: { name: string; slug: string }[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
      {/* Aviso fijo: repite la promesa central de la tienda. Es la
          información que más cuesta vender, así que va siempre visible. */}
      <div className="hidden bg-emerald-600 text-white sm:block">
        <div className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs font-medium">
          Pago contra entrega en toda Colombia · No pagas nada por adelantado
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label={`${STORE_CONFIG.name}, ir al inicio`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">
              {STORE_CONFIG.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight text-zinc-900">
                {STORE_CONFIG.name}
              </span>
              <span className="hidden text-[11px] font-medium text-zinc-500 sm:block">
                {STORE_CONFIG.tagline}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            <HeaderLink href="/">Inicio</HeaderLink>
            <HeaderLink href="/productos">Productos</HeaderLink>
            {categories.length > 0 && <CategoriesMenu categories={categories} />}
            <HeaderLink href="/productos?ofertas=1">Ofertas</HeaderLink>
            <HeaderLink href="/contacto">Contacto</HeaderLink>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/productos"
              className="rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-emerald-700"
              aria-label="Buscar productos"
            >
              <IconSearch className="h-5 w-5" />
            </Link>

            <CartLink />

            {STORE_CONFIG.whatsapp && (
              <a
href={getWhatsAppUrl("Hola, quiero consultar sobre los productos de " + STORE_CONFIG.name + ".")}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:inline-flex"
              >
                <IconWhatsApp className="h-4 w-4" />
                Escríbenos
              </a>
            )}

            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as Route}
      className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-emerald-700"
    >
      {children}
    </Link>
  );
}

/**
 * Menú de categorías con el detalle. Es un `<details>` nativo: funciona sin
 * JavaScript, así que en móvil no depende de que el script haya cargado.
 */
function CategoriesMenu({ categories }: { categories: { name: string; slug: string }[] }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-emerald-700">
        Categorías
        <svg
          className="h-3.5 w-3.5 transition group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="absolute left-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
        {categories.slice(0, 8).map((category) => (
          <Link
            key={category.slug}
            href={`/productos?categoria=${encodeURIComponent(category.name)}` as Route}
            className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-emerald-700"
          >
            {category.name}
          </Link>
        ))}
        <Link
          href="/productos"
          className="mt-1 block border-t border-zinc-100 px-3 py-2 text-sm font-semibold text-emerald-700"
        >
          Ver todo el catálogo
        </Link>
      </div>
    </details>
  );
}

/**
 * Menú móvil. Es un cliente porque necesita estado para abrir y cerrar.
 */
function MobileMenu({ categories }: { categories: { name: string; slug: string }[] }) {
  return (
    <details className="group md:hidden">
      <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-100">
        <IconMenu />
        <span className="sr-only">Abrir menú</span>
      </summary>

      <div className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-white px-4 pb-8 pt-4 sm:top-16">
        <nav className="flex flex-col" aria-label="Menú móvil">
          <MobileLink href="/">Inicio</MobileLink>
          <MobileLink href="/productos">Todos los productos</MobileLink>
          {categories.length > 0 && (
            <div className="border-t border-zinc-100 py-2">
              <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Categorías
              </p>
              {categories.slice(0, 8).map((category) => (
                <MobileLink
                  key={category.slug}
                  href={`/productos?categoria=${encodeURIComponent(category.name)}`}
                  sub
                >
                  {category.name}
                </MobileLink>
              ))}
            </div>
          )}
          <div className="border-t border-zinc-100 pt-2">
            <MobileLink href="/productos?ofertas=1">Ofertas</MobileLink>
            <MobileLink href="/envios">Envíos</MobileLink>
            <MobileLink href="/cambios-y-devoluciones">Cambios y devoluciones</MobileLink>
            <MobileLink href="/contacto">Contacto</MobileLink>
          </div>

          {STORE_CONFIG.whatsapp && (
            <a
              href={getWhatsAppUrl("Hola, quiero consultar sobre los productos de " + STORE_CONFIG.name + ".")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white"
            >
              <IconWhatsApp className="h-4 w-4" />
              Escríbenos por WhatsApp
            </a>
          )}

          <Link
            href="/carrito"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-3.5 text-sm font-semibold text-zinc-700"
          >
            <IconCart className="h-4 w-4" />
            Ver mi carrito
          </Link>
        </nav>
      </div>
    </details>
  );
}

function MobileLink({
  href,
  children,
  sub = false,
}: {
  href: string;
  children: React.ReactNode;
  sub?: boolean;
}) {
  return (
    <Link
      href={href as Route}
      className={`rounded-lg py-3 text-zinc-800 transition hover:text-emerald-700 ${
        sub ? "pl-4 text-[15px]" : "text-base font-semibold"
      }`}
    >
      {children}
    </Link>
  );
}