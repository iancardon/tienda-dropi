import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";
import { getWhatsAppUrl, STORE_CONFIG } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos",
  description: "Catálogo de productos con pago contra entrega en Colombia.",
};

function CategoryChip({
  active,
  label,
  href,
}: {
  active: boolean;
  label: string;
  href: { pathname: "/productos" } | { pathname: "/productos"; query: { categoria: string } };
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-zinc-300 text-zinc-700 hover:border-emerald-400"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categoria =
    typeof params.categoria === "string" && params.categoria.trim() !== ""
      ? params.categoria
      : undefined;

  const [products, categoriesRaw] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, ...(categoria ? { category: categoria } : {}) },
      include: { variants: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { category: true },
    }),
  ]);

  const categories = [...new Set(categoriesRaw.map((c) => c.category))];
  const whatsappUrl = getWhatsAppUrl(
    `Hola 👋 Vi que todavía no hay productos publicados en ${STORE_CONFIG.name}. ¿Me avisan cuando tengan novedades?`
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Productos</h1>
      <p className="mt-1 text-zinc-500">
        Todos los precios se pagan en efectivo contra entrega.
      </p>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <CategoryChip
            active={!categoria}
            label="Todos"
            href={{ pathname: "/productos" }}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              active={categoria === c}
              label={c}
              href={{ pathname: "/productos", query: { categoria: c } }}
            />
          ))}
        </div>
      )}

      {products.length === 0 ? (
        categories.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-zinc-800">
              Estamos preparando el catálogo
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Todavía no hay productos publicados. Mientras tanto puedes
              escribirnos y te avisamos apenas esté disponible.
            </p>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Escríbenos por WhatsApp
              </a>
            )}
          </div>
        ) : (
          <p className="mt-10 text-zinc-500">
            No hay productos en esta categoría.
          </p>
        )
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}