import Link from "next/link";
import type { Route } from "next";
import {
  IconChat,
  IconMail,
  IconMapPin,
  IconTruck,
  IconWhatsApp,
} from "@/components/icons";
import { STORE_CONFIG, formatPhone, getSocialLinks, getWhatsAppUrl } from "@/lib/store";

/**
 * Pie de página. Reúne en un solo sitio lo que un cliente busca antes de
 * comprar: qué se entrega, cómo se cobra, a quién escribe y qué pasa si
 * quiere devolver algo.
 */
export function SiteFooter() {
  const socialLinks = getSocialLinks();
  const whatsappHref = STORE_CONFIG.whatsapp
    ? getWhatsAppUrl(`Hola, tengo una consulta sobre ${STORE_CONFIG.name}.`)
    : null;

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      {/* Promesas repetidas: funcionan como cierre de la página de venta. */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3">
          <FooterPromise
            icon={<IconTruck className="h-5 w-5" />}
            title="Envíos a toda Colombia"
            detail="Ciudades principales y municipios"
          />
          <FooterPromise
            icon={<IconChat className="h-5 w-5" />}
            title="Paga al recibir"
            detail="Sin pagos por adelantado"
          />
          <FooterPromise
            icon={<IconWhatsApp className="h-5 w-5" />}
            title="Atención por WhatsApp"
            detail="Te respondemos rápido"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">
                {STORE_CONFIG.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-[15px] font-bold tracking-tight text-zinc-900">
                {STORE_CONFIG.name}
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Tienda online con pago contra entrega en toda Colombia. Pagas en
              efectivo cuando recibes tu pedido, sin pagos por adelantado.
            </p>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <IconWhatsApp className="h-4 w-4" />
                Escribir por WhatsApp
              </a>
            )}
          </div>

          <FooterColumn title="Productos">
            <FooterLink href="/productos">Todo el catálogo</FooterLink>
            <FooterLink href="/productos?ofertas=1">Ofertas</FooterLink>
            <FooterLink href="/carrito">Mi carrito</FooterLink>
            <FooterLink href="/envios">Envíos y entregas</FooterLink>
          </FooterColumn>

          <FooterColumn title="Ayuda">
            <FooterLink href="/cambios-y-devoluciones">Cambios y devoluciones</FooterLink>
            <FooterLink href="/terminos-y-condiciones">Términos y condiciones</FooterLink>
            <FooterLink href="/politica-de-privacidad">Política de privacidad</FooterLink>
            <FooterLink href="/contacto">Contacto</FooterLink>
          </FooterColumn>

          <FooterColumn title="Contacto">
            {whatsappHref && (
              <FooterLink href={whatsappHref} external>
                <IconWhatsApp className="h-4 w-4" />
                {formatPhone()}
              </FooterLink>
            )}
            <FooterLink href={`mailto:${STORE_CONFIG.email}`} external>
              <IconMail className="h-4 w-4" />
              {STORE_CONFIG.email}
            </FooterLink>
            <p className="flex items-start gap-2 text-sm text-zinc-600">
              <IconMapPin className="h-4 w-4 shrink-0 text-zinc-400" />
              {STORE_CONFIG.address}
            </p>
          </FooterColumn>
        </div>

        {socialLinks.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-500">Síguenos:</span>
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {STORE_CONFIG.name}. Todos los derechos
            reservados. Envíos en Colombia.
          </p>
          <p className="flex items-center gap-1.5">
            <IconMapPin className="h-3.5 w-3.5" />
            {STORE_CONFIG.address}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterPromise({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-zinc-900">{title}</span>
        <span className="block text-xs text-zinc-500">{detail}</span>
      </span>
    </div>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "inline-flex items-center gap-2 text-sm text-zinc-600 transition hover:text-emerald-700";

  if (external) {
    return (
      <li>
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href as Route} className={className}>
        {children}
      </Link>
    </li>
  );
}