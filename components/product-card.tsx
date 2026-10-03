import { SmartImage } from "@/components/smart-image";
import Link from "next/link";
import { IconCash, IconTruck } from "@/components/icons";
import { formatCOP } from "@/lib/format";
import {
  getImages,
  getProductStockStatus,
  getProductDiscount,
  getProductOriginalPrice,
  priceFromProduct,
  type ProductWithVariants,
} from "@/lib/products";

/**
 * Tarjeta de producto del catálogo.
 *
 * Toda la tarjeta es un enlace: en móvil es la superficie táctil más grande
 * disponible y evita tener que apuntar a un botón pequeño. El precio y las
 * etiquetas se calculan con los helpers de `lib/products.ts` para que la
 * tarjeta y la ficha del producto muestren exactamente lo mismo.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductWithVariants;
  /** Carga prioritaria para las primeras tarjetas de la portada. */
  priority?: boolean;
}) {
  const image = getImages(product.images)[0];
  const stockStatus = getProductStockStatus(product);
  const minPrice = priceFromProduct(product);
  const hasOptions =
    product.variants.length > 1 ||
    product.variants.some((v) => v.priceOverride !== null);
  const discount = getProductDiscount(product);
  const originalPrice = getProductOriginalPrice(product);
  const soldOut = stockStatus === "agotado";

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:-translate-y-0.5"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        {image ? (
          <SmartImage
            src={image}
            alt={product.name}
            width={800}
            height={800}
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 48vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-zinc-400">
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}

        {/* Descuento sobre precio tachado. Solo se muestra si el descuento es
            real: `getProductDiscount` devuelve null cuando no aplica. */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {discount && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] leading-4 font-bold text-white shadow-sm">
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="rounded-full bg-zinc-900/85 px-2 py-0.5 text-[11px] leading-4 font-semibold text-white backdrop-blur-sm">
              Destacado
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          {soldOut ? (
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] leading-4 font-semibold text-white">
              Agotado
            </span>
          ) : stockStatus === "bajo_stock" ? (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] leading-4 font-semibold text-white shadow-sm">
              Pocas unidades
            </span>
          ) : null}
        </div>

        {/* Sobre imágenes apagadas, un botón de compra se lee mejor que un
            texto pequeño. Es decorativo: el enlace sigue siendo la tarjeta. */}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">
              Ver producto
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.category && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 sm:text-[11px]">
            {product.category}
          </p>
        )}

        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-900 transition group-hover:text-emerald-700 sm:text-[15px]">
          {product.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold text-zinc-900 sm:text-lg">
            {hasOptions && (
              <span className="mr-1 text-[11px] font-medium text-zinc-500">
                desde
              </span>
            )}
            {formatCOP(minPrice)}
          </span>
          {originalPrice && (
            <span className="text-xs text-zinc-400 line-through sm:text-sm">
              {formatCOP(originalPrice)}
            </span>
          )}
        </div>

        {/* Recordatorio del modelo de pago en la propia tarjeta: reduce la
            duda más común antes de llegar al checkout. */}
        <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-2.5 text-[11px] font-medium text-zinc-500 sm:text-xs">
          <IconCash className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          Paga al recibir
          <IconTruck className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400" />
        </div>
      </div>
    </Link>
  );
}