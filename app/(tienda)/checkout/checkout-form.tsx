"use client";

import { SmartImage } from "@/components/smart-image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { DEPARTMENTS } from "@/lib/colombia";
import { formatCOP } from "@/lib/format";
import { submitOrder, type CheckoutState } from "./actions";
import { STORE_CONFIG } from "@/lib/store";

export type CheckoutItem = {
  variantId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

type Props = {
  items: CheckoutItem[];
  sessionId?: string;
  editableQty: boolean;
};

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none sm:text-sm";

const labelClass = "block text-sm font-medium text-zinc-800";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>;
}

export function CheckoutForm({ items, sessionId, editableQty }: Props) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    submitOrder,
    null
  );

  const singleEditable = editableQty && items.length === 1;
  const maxQty = items[0]?.stock ?? 1;
  const [qty, setQty] = useState(items[0]?.quantity ?? 1);

  const effectiveItems = items.map((it, idx) =>
    singleEditable && idx === 0 ? { ...it, quantity: qty } : it
  );

  const subtotal = effectiveItems.reduce(
    (sum, it) => sum + it.unitPrice * it.quantity,
    0
  );
  const shipping = STORE_CONFIG.shippingCost;
  const total = subtotal + shipping;

  const itemsJson = JSON.stringify(
    effectiveItems.map((it) => ({
      productVariantId: it.variantId,
      quantity: it.quantity,
    }))
  );

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form action={formAction} className="lg:col-span-3">
        <input type="hidden" name="items" value={itemsJson} />
        {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}

        {state?.error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800"
          >
            <span className="mt-0.5 shrink-0 font-bold">!</span>
            <span>{state.error}</span>
          </div>
        )}

        <h2 className="text-lg font-bold text-zinc-900">Datos del cliente</h2>
        <p className="mt-1 text-sm text-zinc-600">
          No pagas nada ahora. Te contactaremos por WhatsApp para confirmar.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="customerName" className={labelClass}>
              Nombre completo *
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              autoComplete="name"
              required
              placeholder="Tu nombre y apellido"
              className={`${inputClass} mt-1`}
            />
            <FieldError message={state?.fieldErrors?.customerName} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customerPhone" className={labelClass}>
                Teléfono *
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="Ej. 3001234567"
                className={`${inputClass} mt-1`}
              />
              <FieldError message={state?.fieldErrors?.customerPhone} />
            </div>
            <div>
              <label htmlFor="customerEmail" className={labelClass}>
                Correo electrónico (opcional)
              </label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                className={`${inputClass} mt-1`}
              />
              <FieldError message={state?.fieldErrors?.customerEmail} />
            </div>
          </div>

          <h2 className="mt-7 text-lg font-bold text-zinc-900">
            Dirección de entrega
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Incluye barrio, casa o apartamento y una referencia cercana. Entre
            más claro, más rápido llega tu pedido.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="customerAddress" className={labelClass}>
                Dirección *
              </label>
              <input
                id="customerAddress"
                name="customerAddress"
                type="text"
                autoComplete="street-address"
                required
                placeholder="Calle, carrera, número, casa/apartamento"
                className={`${inputClass} mt-1`}
              />
              <FieldError message={state?.fieldErrors?.customerAddress} />
            </div>

            <div>
              <label htmlFor="customerNeighborhood" className={labelClass}>
                Barrio / Sector *
              </label>
              <input
                id="customerNeighborhood"
                name="customerNeighborhood"
                type="text"
                autoComplete="address-level3"
                required
                placeholder="Ej. Laureles, El Poblado, Centro"
                className={`${inputClass} mt-1`}
              />
              <FieldError message={state?.fieldErrors?.customerNeighborhood} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customerCity" className={labelClass}>
                  Ciudad *
                </label>
                <input
                  id="customerCity"
                  name="customerCity"
                  type="text"
                  autoComplete="address-level2"
                  required
                  placeholder="Ej. Medellín"
                  className={`${inputClass} mt-1`}
                />
                <FieldError message={state?.fieldErrors?.customerCity} />
              </div>
              <div>
                <label htmlFor="customerDepartment" className={labelClass}>
                  Departamento *
                </label>
                <select
                  id="customerDepartment"
                  name="customerDepartment"
                  required
                  defaultValue=""
                  className={`${inputClass} mt-1`}
                >
                  <option value="" disabled>
                    Selecciona...
                  </option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FieldError message={state?.fieldErrors?.customerDepartment} />
              </div>
            </div>

            <div>
              <label htmlFor="customerReference" className={labelClass}>
                Referencia adicional (opcional)
              </label>
              <input
                id="customerReference"
                name="customerReference"
                type="text"
                placeholder="Punto de referencia, color de la casa, portería, etc."
                className={`${inputClass} mt-1`}
              />
              <FieldError message={state?.fieldErrors?.customerReference} />
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="terms"
                id="terms"
                required
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-sm text-zinc-700">
                Acepto la{" "}
                <Link
                  href="/politica-de-privacidad"
                  target="_blank"
                  className="underline hover:text-emerald-600"
                >
                  política de tratamiento de datos personales
                </Link>{" "}
                y los{" "}
                <Link
                  href="/terminos-y-condiciones"
                  target="_blank"
                  className="underline hover:text-emerald-600"
                >
                  términos y condiciones
                </Link>
                , y autorizo el uso de mis datos para procesar este pedido.
                <FieldError message={state?.fieldErrors?.terms} />
              </div>
            </label>
            <p className="mt-1 pl-6 text-xs text-zinc-400">
              No puedes confirmar el pedido sin marcar esta casilla.
            </p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 sm:text-sm"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Enviando pedido…
              </>
            ) : (
              "Confirmar pedido (pago contra entrega)"
            )}
          </button>

          <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
            Te escribiremos por WhatsApp para confirmar. No se cobra nada sin tu
            confirmación.
          </p>
        </div>
      </form>

      <aside className="lg:col-span-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-zinc-900">
            Resumen del pedido
          </h2>

          <ul className="mt-4 divide-y divide-zinc-200">
            {effectiveItems.map((it) => (
              <li key={it.variantId} className="flex items-start gap-3 py-3">
                {it.productImage ? (
                  <SmartImage
                    src={it.productImage}
                    alt={it.productName}
                    width={64}
                    height={64}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-[10px] text-zinc-500">
                    Sin img
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/productos/${it.productSlug}`}
                    className="text-sm leading-snug font-semibold text-zinc-900 transition hover:text-emerald-700"
                  >
                    {it.productName}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Variante: {it.variantName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatCOP(it.unitPrice)} × {it.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-zinc-900">
                  {formatCOP(it.unitPrice * it.quantity)}
                </span>
              </li>
            ))}
          </ul>

          {singleEditable && (
            <div className="mt-3 flex items-center justify-between text-sm text-zinc-600">
              <span>Cantidad</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-7 w-7 rounded border border-zinc-300 bg-white transition hover:border-emerald-400"
                  aria-label="Disminuir cantidad"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="h-7 w-7 rounded border border-zinc-300 bg-white transition hover:border-emerald-400"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2 border-t border-zinc-200 pt-3 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Envío (Contra entrega)</span>
              <span>{formatCOP(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold">
              <span>Total a pagar</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs leading-relaxed text-emerald-800">
            <strong className="font-semibold">Pago contra entrega:</strong>{" "}
            pagas {formatCOP(total)} en efectivo cuando recibas el pedido, envío
            incluido.
          </div>

          <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
            <Link
              href="/terminos-y-condiciones"
              className="underline hover:text-emerald-600"
            >
              Términos y Condiciones
            </Link>
            <span className="text-zinc-300">|</span>
            <Link
              href="/politica-de-privacidad"
              className="underline hover:text-emerald-600"
            >
              Política de Privacidad
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/envios" className="underline hover:text-emerald-600">
              Política de Envíos
            </Link>
            <span className="text-zinc-300">|</span>
            <Link
              href="/cambios-y-devoluciones"
              className="underline hover:text-emerald-600"
            >
              Cambios y Devoluciones
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/contacto" className="underline hover:text-emerald-600">
              Contacto
            </Link>
          </div>

          {items.length === 1 && (
            <Link
              href={`/productos/${items[0].productSlug}`}
              className="mt-4 block text-center text-sm font-medium text-zinc-500 transition hover:text-emerald-600"
            >
              Volver al producto
            </Link>
          )}
          {items.length > 1 && (
            <Link
              href="/carrito"
              className="mt-4 block text-center text-sm font-medium text-zinc-500 transition hover:text-emerald-600"
            >
              Volver al carrito
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
