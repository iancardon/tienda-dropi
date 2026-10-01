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
    <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Documento sin completar</p>
      <p className="mt-1">
        Antes de publicar, estos datos deben quedar definitivos. Los que salen de
        variables de entorno se cambian en <code className="font-mono">.env</code>; los
        marcados como &quot;se edita en la página&quot; se cambian en el texto del
        documento.
      </p>
      <ul className="mt-3 space-y-1">
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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-zinc-500">{intro}</p>
      <p className="mt-1 text-sm text-zinc-400">
        Última actualización: {legalUpdatedAt()}
      </p>

      <PendingNotice />

      <div className="mt-8 space-y-6 text-zinc-700 leading-relaxed">
        {children}
      </div>

      <div className="mt-10 space-y-4 border-t border-zinc-200 pt-6 text-sm">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-zinc-500">
          <Link href="/politica-de-privacidad" className="hover:text-emerald-600">
            Política de privacidad
          </Link>
          <Link href="/terminos-y-condiciones" className="hover:text-emerald-600">
            Términos y condiciones
          </Link>
          <Link href="/cambios-y-devoluciones" className="hover:text-emerald-600">
            Cambios y devoluciones
          </Link>
          <Link href="/envios" className="hover:text-emerald-600">
            Envíos
          </Link>
          <Link href="/contacto" className="hover:text-emerald-600">
            Contacto
          </Link>
        </nav>
        <p>
          <Link href="/" className="font-medium text-emerald-600 hover:text-emerald-700">
            ← Volver a {STORE_CONFIG.name}
          </Link>
        </p>
      </div>
    </div>
  );
}
