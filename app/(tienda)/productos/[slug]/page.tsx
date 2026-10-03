import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/buy-box";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import {
  IconChat,
  IconChevronRight,
  IconRotate,
  IconTruck,
  IconWhatsApp,
} from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { getImages, priceFromProduct } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import {
  getProductDiscount,
  getProductOriginalPrice,
  getProductStockStatus,
} from "@/lib/products";
import { STORE_CONFIG, getWhatsAppUrl } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      shortDescription: true,
      images: true,
      active: true,
      isDemo: true,
    },
  });
  if (!product || !product.active || product.isDemo) return {};

  const images = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
  const firstImage = Array.isArray(images) ? images[0] : undefined;
  const description = (product.shortDescription ?? product.description).slice(0, 155);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: firstImage ? [firstImage] : [],
      type: "website",
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true },
  });

  // Un producto demo nunca se publica, ni siquiera si alguien lo activa por error.
  if (!product || !product.active || product.isDemo) notFound();

  // Productos de la misma categoría, excluyendo este. Es lo más cercano a
  // "te puede interesar" que se puede construir sin inventar afinidades.
  const related = product.category
    ? await prisma.product.findMany({
        where: {
          active: true,
          isDemo: false,
          category: product.category,
          id: { not: product.id },
        },
        include: { variants: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 4,
      })
    : [];

  const images = getImages(product.images);
  const discount = getProductDiscount(product);
  const originalPrice = getProductOriginalPrice(product);
  const minPrice = priceFromProduct(product);
  const stockStatus = getProductStockStatus(product);
  const isFeatured = product.featured;
  const soldOut = stockStatus === "agotado";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          ...(product.category
            ? [
                {
                  label: product.category,
                  href: `/productos?categoria=${encodeURIComponent(product.category)}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <ProductGallery images={images} name={product.name} />

        <div className="lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2">
            {discount && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                -{discount}%
              </span>
            )}
            {isFeatured && (
              <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                Destacado
              </span>
            )}
            {product.category && (
              <Link
                href={`/productos?categoria=${encodeURIComponent(product.category)}`}
                className="text-xs font-semibold tracking-wide text-emerald-700 uppercase hover:text-emerald-800"
              >
                {product.category}
              </Link>
            )}
          </div>

          <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight text-balance text-zinc-900 sm:text-3xl">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold text-zinc-900">
              {formatCOP(minPrice)}
            </span>
            {originalPrice && (
              <span className="text-lg text-zinc-400 line-through">
                {formatCOP(originalPrice)}
              </span>
            )}
            {discount && (
              <span className="text-sm font-semibold text-red-600">
                Ahorras {formatCOP(originalPrice! - minPrice)}
              </span>
            )}
          </div>

          <StockBadge status={stockStatus} />

          {product.description && (
            <p className="mt-5 text-[15px] leading-relaxed whitespace-pre-line text-zinc-600">
              {product.description}
            </p>
          )}

          <div className="mt-6">
            <BuyBox basePrice={product.basePrice} variants={product.variants} />
          </div>

          {STORE_CONFIG.whatsapp && !soldOut && (
            <a
              href={getWhatsAppUrl(
                `Hola, quiero consultar por el producto "${product.name}" (${STORE_CONFIG.url}/productos/${product.slug}).`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
            >
              <IconWhatsApp className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          )}

          <InfoBlocks slug={product.slug} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-zinc-200 pt-12">
          <SectionHeading
            eyebrow="También te puede interesar"
            title="Productos relacionados"
            action={
              <Link
                href={`/productos?categoria=${encodeURIComponent(product.category ?? "")}`}
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Ver más →
              </Link>
            }
          />
          <div className="mt-7 grid-products grid gap-3 sm:gap-4 lg:gap-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Ruta de navegación" className="overflow-x-auto">
      <ol className="flex items-center gap-1 text-sm whitespace-nowrap text-zinc-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-emerald-700">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-zinc-900" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <IconChevronRight className="h-3.5 w-3.5 text-zinc-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StockBadge({ status }: { status: "disponible" | "bajo_stock" | "agotado" }) {
  const config = {
    disponible: {
      dot: "bg-emerald-600",
      text: "text-emerald-700",
      label: "Disponible",
    },
    bajo_stock: {
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: "Pocas unidades disponibles",
    },
    agotado: {
      dot: "bg-zinc-400",
      text: "text-zinc-500",
      label: "Agotado por ahora",
    },
  }[status];

  return (
    <p className={`mt-4 flex items-center gap-2 text-sm font-medium ${config.text}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </p>
  );
}

/**
 * Información de compra: envío, forma de pago y cambios. Reutiliza el mismo
 * lenguaje en todo el sitio para que nadie dude de cómo se paga.
 */
function InfoBlocks({ slug }: { slug: string }) {
  const blocks = [
    {
      icon: <IconTruck className="h-5 w-5" />,
      title: "Envíos a toda Colombia",
      description:
        "Despachamos a ciudades principales, municipios y zonas rurales según cobertura.",
      href: "/envios",
      linkLabel: "Ver política de envíos",
    },
    {
      icon: <IconChat className="h-5 w-5" />,
      title: "Paga contra entrega",
      description:
        "No pagas nada por adelantado. Pagas en efectivo cuando recibes el pedido.",
    },
    {
      icon: <IconRotate className="h-5 w-5" />,
      title: "Cambios y devoluciones",
      description:
        "Puedes solicitar cambio o devolución siguiendo las condiciones de nuestra política.",
      href: "/cambios-y-devoluciones",
      linkLabel: "Ver condiciones",
    },
  ];

  return (
    <div className="mt-7 space-y-3 border-t border-zinc-200 pt-6">
      {blocks.map((block) => (
        <div key={block.title} className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            {block.icon}
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-zinc-900">{block.title}</p>
            <p className="mt-0.5 leading-relaxed text-zinc-600">
              {block.description}
            </p>
            {block.href && (
              <Link
                href={block.href}
                className="mt-1 inline-block font-medium text-emerald-700 hover:text-emerald-800"
              >
                {block.linkLabel} →
              </Link>
            )}
          </div>
        </div>
      ))}

      <p className="pt-1 text-xs text-zinc-400">
        Referencia del producto:{" "}
        <span className="font-mono">{slug}</span>
      </p>
    </div>
  );
}