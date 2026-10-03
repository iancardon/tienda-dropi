import Link from "next/link";
import { IconArrowRight, IconChat, IconTruck } from "@/components/icons";
import { STORE_CONFIG } from "@/lib/store";

/**
 * Estado vacío del catálogo. Aparece mientras la tienda no tiene productos
 * publicados. No inventa productos: solo explica qué va a pasar y ofrece
 * contacto por WhatsApp, que sí funciona desde el primer día.
 */
export function CatalogEmpty({
  title = "Próximamente habrá productos aquí",
  description = "Estamos preparando el catálogo. Vuelve en unos días o escríbenos y te avisamos en cuanto haya novedades.",
}: {
  title?: string;
  description?: string;
}) {
  const whatsappHref = STORE_CONFIG.whatsapp
    ? `https://wa.me/${STORE_CONFIG.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, vi que ${STORE_CONFIG.name} todavía no tiene productos publicados. ¿Me avisan cuando haya novedades?`
      )}`
    : null;

  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-5 py-12 text-center sm:px-10 sm:py-16">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <IconTruck className="h-6 w-6 text-zinc-400" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-zinc-900 sm:text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-zinc-600">
        {description}
      </p>

      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            <IconChat className="h-4 w-4" />
            Avísame por WhatsApp
          </a>
        )}
        <Link
          href="/contacto"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700 sm:w-auto"
        >
          Ver canales de contacto
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Mientras tanto ya puedes revisar cómo funciona el pago contra entrega en{" "}
        <Link href="/envios" className="underline hover:text-emerald-700">
          nuestra política de envíos
        </Link>
        .
      </p>
    </div>
  );
}