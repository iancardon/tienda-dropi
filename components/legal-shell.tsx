import Link from "next/link";
import type { ReactNode } from "react";
import {
  legalUpdatedAt,
  pendingLegalFields,
  type LegalField,
} from "@/lib/legal";
import { STORE_CONFIG } from "@/lib/store";

const chipClass =
  "inline-block rounded-md border border-amber-400 bg-amber-50 px-1.5 py-0.5 align-baseline font-mono text-[0.8em] font-medium text-amber-800";

/** Texto marcado cuando el dato todavía no está definido. */
export function Pending({ children }: { children: ReactNode }) {
  return <span className={chipClass}>{children}</span>;
}

/**
 * Pinta un dato de la tienda. Si el valor sigue en modo "ejemplo", se muestra
 * el texto marcado en lugar de un valor falso.
 */
export function LegalValue({ field }: { field: LegalField }) {
  if (field.pending) {
    return <Pending>{`[[COMPLETAR: ${field.label}]]`}</Pending>;
  }
  return <>{field.value}</>;
}

/**
 * Aviso visible solo mientras falten datos por configurar. Sirve para no
 * publicar una tienda con datos legales inventados.
 */
export function PendingNotice() {
  const pending = pendingLegalFields();
  if (pending.length === 0) return null;

return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Documento sin completar</p>
      <p className="mt-1 leading-relaxed">
        Antes de publicar, estos datos deben quedar definitivos. Los que salen
        de variables de entorno se cambian en <code className="font-mono">.env</code>; los
        marcados como &quot;se edita en la página&quot; se cambian en el texto del
        documento.
      </p>
      <ul className="mt-3 space-y-1.5">
        {pending.map((field) => (
          <li key={field.key} className="flex flex-wrap items-center gap-2">
            <span>{field.label}</span>
            {field.env ? (
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
                {field.env}
              </code>
            ) : (
              <span className="text-xs italic">se edita en la página</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Esqueleto común de las páginas legales. */
export function LegalShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
          {intro}
        </p>
        <p className="mt-1.5 text-xs text-zinc-400">
          Última actualización: {legalUpdatedAt()}
        </p>
      </header>

      <PendingNotice />

      {/* Los documentos largos se leen mucho mejor con interlineado amplio y
          títulos visibles: quien entra aquí busca un apartado concreto, no
          quiere el pasar de largo. */}
      <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-zinc-700 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>

      <div className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm">
        <p className="font-semibold text-zinc-900">Otros documentos</p>
        <nav className="mt-3 flex flex-wrap gap-2">
          {[
            { href: "/politica-de-privacidad", label: "Política de privacidad" },
            { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
            { href: "/cambios-y-devoluciones", label: "Cambios y devoluciones" },
            { href: "/envios", label: "Envíos" },
            { href: "/contacto", label: "Contacto" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4">
          <Link
            href="/"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Volver a {STORE_CONFIG.name}
          </Link>
        </p>
      </div>
    </div>
  );
}
