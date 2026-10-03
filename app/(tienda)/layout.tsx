import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloatingButton } from "@/components/whatsapp-float";
import { prisma } from "@/lib/prisma";

/**
 * Layout de la tienda pública.
 *
 * Se usa un grupo de rutas `(tienda)` para que la cabecera, el pie y el botón
 * de WhatsApp aparezcan en las páginas del cliente sin arrastrar al panel de
 * administración, que tiene su propio layout. El grupo no forma parte de la
 * URL: las rutas siguen siendo `/`, `/productos`, `/carrito`, etc.
 *
 * Las categorías salen de la base de datos, no de una lista fija. Así el menú
 * refleja lo que hay publicado sin necesidad de tocar el código cuando se
 * agreguen categorías nuevas. Si la consulta falla, la tienda sigue
 * funcionando: el menú muestra el resto de enlaces.
 */
export default async function TiendaLayout({ children }: { children: ReactNode }) {
  const categories = await getCategories();

  return (
    <>
      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFloatingButton />
    </>
  );
}

async function getCategories(): Promise<{ name: string; slug: string }[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { active: true, isDemo: false, category: { not: "" } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return rows.map((row) => ({
      name: row.category,
      slug: row.category,
    }));
  } catch {
    return [];
  }
}