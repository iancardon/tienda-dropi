import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Cabecera de sección reutilizable. Mantiene el mismo título, antetítulo y
 * subtítulo en toda la tienda para que el ritmo visual sea consistente.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const centered = align === "center";

  return (
    <div
      className={
        centered
          ? "mx-auto max-w-2xl text-center"
          : "flex flex-wrap items-end justify-between gap-4"
      }
    >
      <div className={centered ? "" : "max-w-2xl"}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{subtitle}</p>
        )}
      </div>
      {action && <div className={centered ? "mt-5" : ""}>{action}</div>}
    </div>
  );
}

/**
 * Enlace con flecha, para el "Ver todo" de cada sección.
 */
export function SeeAllLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href as never}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:gap-2.5 hover:text-emerald-800"
    >
      {children}
    </Link>
  );
}