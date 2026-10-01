"use client";

import { useActionState, useMemo, useState } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { calculateMargin, marginTone, suggestedSalePrice, MIN_MARGIN_PERCENT } from "@/lib/pricing";
import type { ProductFormState } from "./actions";

type VariantRow = {
  key: string;
  id?: string;
  name: string;
  sku: string;
  priceOverride: string;
  stock: string;
  stockStatus: string;
};

type ProductData = {
  id: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string | null;
  basePrice: number;
  originalPrice: number | null;
  featured: boolean;
  supplierPrice: number;
  supplierShippingCost: number;
  supplier: string;
  supplierProductId: string | null;
  images: string[];
  active: boolean;
  isDemo: boolean;
};

type ProductFormProps = {
  product?: ProductData;
  variants?: {
    id: string;
    name: string;
    sku: string;
    priceOverride: number | null;
    stock: number;
    stockStatus: string;
  }[];
  action: (
    prev: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  submitLabel: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";
const labelClass = "block text-sm font-medium text-zinc-700";

let rowKey = 0;
function nextKey(): string {
  rowKey += 1;
  return `row-${rowKey}-${Date.now()}`;
}

export function ProductForm({
  product,
  variants,
  action,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    null
  );

  const [rows, setRows] = useState<VariantRow[]>(
    variants && variants.length > 0
      ? variants.map((v) => ({
          key: nextKey(),
          id: v.id,
          name: v.name,
          sku: v.sku,
          priceOverride: v.priceOverride !== null ? String(v.priceOverride) : "",
          stock: String(v.stock),
          stockStatus: v.stockStatus,
        }))
      : [{ key: nextKey(), name: "", sku: "", priceOverride: "", stock: "0", stockStatus: "disponible" }]
  );

  const [images, setImages] = useState<string>(
    product?.images.join("\n") ?? ""
  );

  const [basePrice, setBasePrice] = useState(
    product ? String(product.basePrice) : ""
  );
  const [supplierPrice, setSupplierPrice] = useState(
    product ? String(product.supplierPrice) : ""
  );
  const [supplierShippingCost, setSupplierShippingCost] = useState(
    product ? String(product.supplierShippingCost ?? 0) : "0"
  );

  // El margen se calcula sobre el costo total: producto + envío que cobra el proveedor.
  const margin = useMemo(
    () =>
      calculateMargin(
        Number.parseFloat(basePrice) || 0,
        (Number.parseFloat(supplierPrice) || 0) +
          (Number.parseFloat(supplierShippingCost) || 0)
      ),
    [basePrice, supplierPrice, supplierShippingCost]
  );

  const setRow = (key: string, patch: Partial<VariantRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { key: nextKey(), name: "", sku: "", priceOverride: "", stock: "0", stockStatus: "disponible" },
    ]);
  };

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-bold">Información del producto</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={product?.name}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>
              Categoría *
            </label>
            <input
              id="category"
              name="category"
              type="text"
              required
              placeholder="Ej. Tecnología"
              defaultValue={product?.category}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="supplier" className={labelClass}>
              Proveedor
            </label>
            <input
              id="supplier"
              name="supplier"
              type="text"
              placeholder="Ej. Dropi"
              defaultValue={product?.supplier ?? "Dropi"}
              className={`${inputClass} mt-1`}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Quién despacha el pedido. Hoy el trabajo con el proveedor es manual.
            </p>
          </div>
          <div>
            <label htmlFor="supplierProductId" className={labelClass}>
              ID del producto en el proveedor
            </label>
            <input
              id="supplierProductId"
              name="supplierProductId"
              type="text"
              placeholder="Ej. dropi-1001"
              defaultValue={product?.supplierProductId ?? ""}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="basePrice" className={labelClass}>
              Precio de venta (COP) *
            </label>
            <input
              id="basePrice"
              name="basePrice"
              type="number"
              step="100"
              min="0"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="supplierPrice" className={labelClass}>
              Costo del proveedor (COP) *
            </label>
            <input
              id="supplierPrice"
              name="supplierPrice"
              type="number"
              step="100"
              min="0"
              required
              value={supplierPrice}
              onChange={(e) => setSupplierPrice(e.target.value)}
              className={`${inputClass} mt-1`}
            />
            <p className="mt-1 text-xs text-zinc-400">
              No se muestra al público.
            </p>
          </div>
          <div>
            <label htmlFor="supplierShippingCost" className={labelClass}>
              Costo de envío del proveedor (COP)
            </label>
            <input
              id="supplierShippingCost"
              name="supplierShippingCost"
              type="number"
              step="100"
              min="0"
              placeholder="0"
              value={supplierShippingCost}
              onChange={(e) => setSupplierShippingCost(e.target.value)}
              className={`${inputClass} mt-1`}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Lo que te cobra el proveedor por despachar. Si es 0, no lo cobra.
            </p>
          </div>
          <div className="sm:col-span-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm">
            <p className="font-medium text-zinc-700">Margen estimado</p>
            {basePrice !== "" && supplierPrice !== "" ? (
              <>
                <p className={`mt-1 font-semibold ${marginTone(margin)}`}>
                  {margin.isLoss
                    ? "Estás vendiendo por debajo del costo del proveedor."
                    : `Ganancia ${margin.amount.toLocaleString("es-CO")} por unidad (${margin.percent}% sobre la venta).`}
                </p>
                {margin.isLow && !margin.isLoss && (
                  <p className="mt-1 text-xs text-amber-700">
                    Margen bajo. Para un margen del {MIN_MARGIN_PERCENT}% el
                    precio de venta debería ser{" "}
                    {suggestedSalePrice(
                      (Number.parseFloat(supplierPrice) || 0) +
                        (Number.parseFloat(supplierShippingCost) || 0)
                    ).toLocaleString("es-CO")}
                    .
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  Markup sobre el costo: {margin.markupPercent}%. El cálculo usa
                  el costo total (producto + envío del proveedor). El envío al
                  cliente y tus gastos los pagas tú, así que el margen real es
                  menor.
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                Completa el precio de venta y el costo para ver el margen.
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              defaultValue={product?.description}
              className={`${inputClass} mt-1 resize-y`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shortDescription" className={labelClass}>
              Descripción corta
            </label>
            <input
              id="shortDescription"
              name="shortDescription"
              type="text"
              placeholder="Resumen para tarjetas y listados"
              defaultValue={product?.shortDescription ?? ""}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="originalPrice" className={labelClass}>
              Precio original (antes del descuento)
            </label>
            <input
              id="originalPrice"
              name="originalPrice"
              type="number"
              step="100"
              min="0"
              placeholder="Opcional"
              defaultValue={product?.originalPrice ?? ""}
              className={`${inputClass} mt-1`}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Si es mayor al precio de venta, se muestra tachado con el % de descuento.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product ? product.featured : false}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              Producto destacado (aparece en la portada)
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="images" className={labelClass}>
              Imágenes
            </label>
            <div className="mt-1">
              <ImageUploader value={images} onChange={setImages} />
            </div>
            <textarea
              id="images"
              name="images"
              rows={3}
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="https://.../foto1.jpg"
              className={`${inputClass} mt-3 resize-y`}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Sube archivos o pega URLs (una por línea). La primera es la imagen
              principal.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product ? product.active : true}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            Producto activo (visible en la tienda)
          </label>
          <label className="flex items-start gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              name="isDemo"
              defaultChecked={product ? product.isDemo : false}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500"
            />
            <span>
              Producto DEMO (solo para pruebas)
              <span className="block text-xs font-normal text-zinc-500">
                No lo publiques: sirve para probar la tienda antes de cargar el
                catálogo real.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Variantes</h2>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            + Agregar variante
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Deja el precio vacío para usar el precio base. Para desactivar una
          variante, marca &quot;Agotado&quot;.
        </p>

        <input type="hidden" name="variants_count" value={rows.length} />

        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 p-3"
            >
              {row.id && <input type="hidden" name={`variant_id_${rows.indexOf(row)}`} value={row.id} />}
              <input
                type="text"
                name={`variant_name_${rows.indexOf(row)}`}
                placeholder="Nombre (ej. Negro)"
                value={row.name}
                onChange={(e) => setRow(row.key, { name: e.target.value })}
                className={`${inputClass} w-36`}
              />
              <input
                type="text"
                name={`variant_sku_${rows.indexOf(row)}`}
                placeholder="SKU"
                value={row.sku}
                onChange={(e) => setRow(row.key, { sku: e.target.value })}
                className={`${inputClass} w-32`}
              />
              <input
                type="number"
                name={`variant_price_${rows.indexOf(row)}`}
                placeholder="Precio (opcional)"
                step="100"
                min="0"
                value={row.priceOverride}
                onChange={(e) =>
                  setRow(row.key, { priceOverride: e.target.value })
                }
                className={`${inputClass} w-40`}
              />
              <input
                type="number"
                name={`variant_stock_${rows.indexOf(row)}`}
                placeholder="Stock"
                min="0"
                value={row.stock}
                onChange={(e) => setRow(row.key, { stock: e.target.value })}
                className={`${inputClass} w-24`}
              />
              <select
                name={`variant_stockStatus_${rows.indexOf(row)}`}
                value={row.stockStatus}
                onChange={(e) => setRow(row.key, { stockStatus: e.target.value })}
                className={`${inputClass} w-40`}
              >
                <option value="disponible">Disponible</option>
                <option value="bajo_stock">Bajo stock</option>
                <option value="agotado">Agotado</option>
              </select>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                aria-label="Quitar variante"
                className="rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {pending ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}