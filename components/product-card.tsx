import { SmartImage } from "@/components/smart-image";
import Link from "next/link";
import { formatCOP } from "@/lib/format";
import {
  getImages,
  getProductStockStatus,
  getProductDiscount,
  getProductOriginalPrice,
  priceFromProduct,
  type ProductWithVariants,
} from "@/lib/products";

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const image = getImages(product.images)[0];
  const stockStatus = getProductStockStatus(product);
  const minPrice = priceFromProduct(product);
  const hasOptions =
    product.variants.length > 1 ||
    product.variants.some((v) => v.priceOverride !== null);
  const discount = getProductDiscount(product);
  const originalPrice = getProductOriginalPrice(product);
  const isFeatured = product.featured;

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-emerald-300 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        {image ? (
          <SmartImage
            src={image}
            alt={product.name}
            width={800}
            height={800}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin imagen
          </div>
        )}
        {(isFeatured || discount) && (
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {isFeatured && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                Destacado
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                -{discount}%
              </span>
            )}
          </div>
        )}
        {stockStatus === "agotado" && (
          <span className="absolute right-2 top-2 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">
            Agotado
          </span>
        )}
        {stockStatus === "bajo_stock" && (
          <span className="absolute right-2 top-2 rounded-full bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white">
            Pocas unidades
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {product.category}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold text-zinc-900 group-hover:text-emerald-700">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-zinc-900">
            {hasOptions ? `Desde ${formatCOP(minPrice)}` : formatCOP(minPrice)}
          </span>
          {originalPrice && (
            <span className="text-sm line-through text-zinc-400">
              {formatCOP(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}