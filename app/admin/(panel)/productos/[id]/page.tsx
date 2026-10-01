import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getImages } from "@/lib/products";
import { updateProduct } from "../actions";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar producto",
};

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/productos"
        className="text-sm font-medium text-zinc-500 transition hover:text-emerald-600"
      >
        ← Volver a productos
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Editar: {product.name}</h1>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <a
          href={`/productos/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          Ver en la tienda →
        </a>
        <span className="text-zinc-400">Slug: /productos/{product.slug}</span>
      </div>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          category: product.category,
          description: product.description,
          shortDescription: product.shortDescription,
          basePrice: product.basePrice,
          originalPrice: product.originalPrice,
          featured: product.featured,
          supplierPrice: product.supplierPrice,
          supplierShippingCost: product.supplierShippingCost,
          supplier: product.supplier,
          supplierProductId: product.supplierProductId,
          images: getImages(product.images),
          active: product.active,
          isDemo: product.isDemo,
        }}
        variants={product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          priceOverride: v.priceOverride,
          stock: v.stock,
          stockStatus: v.stockStatus,
        }))}
        action={updateProduct}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}