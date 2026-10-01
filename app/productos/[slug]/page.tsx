import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/buy-box";
import { ProductGallery } from "@/components/product-gallery";
import { prisma } from "@/lib/prisma";
import { getImages } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import {
  getProductDiscount,
  getProductOriginalPrice,
  getProductStockStatus,
} from "@/lib/products";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, shortDescription: true, images: true },
  });
  if (!product) return {};
  const images = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
  const firstImage = Array.isArray(images) ? images[0] : undefined;
  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? product.description.slice(0, 155),
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

  if (!product || !product.active) notFound();

  const images = getImages(product.images);
  const discount = getProductDiscount(product);
  const originalPrice = getProductOriginalPrice(product);
  const minPrice = product.variants.reduce(
    (min, v) => Math.min(min, v.priceOverride ?? product.basePrice),
    product.basePrice
  );
  const stockStatus = getProductStockStatus(product);
  const isFeatured = product.featured;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-zinc-500">
        <Link href="/productos" className="transition hover:text-emerald-600">
          Productos
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">{product.category}</span>
      </nav>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-2">
        <ProductGallery images={images} name={product.name} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isFeatured && (
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Destacado
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                -{discount}%
              </span>
            )}
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {product.category}
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">
            {product.name}
          </h1>
          {product.shortDescription && (
            <p className="mt-2 text-zinc-600">{product.shortDescription}</p>
          )}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-zinc-900">
              {formatCOP(minPrice)}
            </span>
            {originalPrice && (
              <span className="text-xl line-through text-zinc-400">
                {formatCOP(originalPrice)}
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-sm font-semibold text-white">
                -{discount}%
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            {stockStatus === "disponible" && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Disponible
              </span>
            )}
            {stockStatus === "bajo_stock" && (
              <span className="flex items-center gap-1 text-sm text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                Pocas unidades disponibles
              </span>
            )}
            {stockStatus === "agotado" && (
              <span className="flex items-center gap-1 text-sm text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-zinc-400" />
                Agotado
              </span>
            )}
          </div>
          <p className="mt-4 whitespace-pre-line text-zinc-600">
            {product.description}
          </p>
          <div className="mt-6">
            <BuyBox basePrice={product.basePrice} variants={product.variants} />
          </div>
          <div className="mt-6 border-t border-zinc-200 pt-6">
            <h3 className="font-semibold">Información de envío y pago</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4 2 2 0 010 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Envío a toda Colombia
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pago contra entrega: pagas al recibir
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Te contactamos por WhatsApp para confirmar
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}