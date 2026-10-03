"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DEPARTMENTS } from "@/lib/colombia";
import { prisma } from "@/lib/prisma";
import { notifyNewOrder } from "@/lib/order-email";
import { variantPrice } from "@/lib/products";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { STORE_CONFIG } from "@/lib/store";

export type CheckoutState = {
  error?: string;
  fieldErrors?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    customerNeighborhood?: string;
    customerCity?: string;
    customerDepartment?: string;
    customerReference?: string;
    terms?: string;
  };
} | null;

type RawItem = { productVariantId: string; quantity: number };

function parseItems(raw: string): RawItem[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const items: RawItem[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const productVariantId = String(
      (entry as Record<string, unknown>).productVariantId ?? ""
    ).trim();
    if (!productVariantId) continue;
    const qtyRaw = parseInt(
      String((entry as Record<string, unknown>).quantity ?? "1"),
      10
    );
    const quantity = Number.isFinite(qtyRaw)
      ? Math.min(Math.max(qtyRaw, 1), 99)
      : 1;
    items.push({ productVariantId, quantity });
  }
  return items;
}

export async function submitOrder(
  prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerAddress = String(formData.get("customerAddress") ?? "").trim();
  const customerNeighborhood = String(formData.get("customerNeighborhood") ?? "").trim();
  const customerCity = String(formData.get("customerCity") ?? "").trim();
  const customerDepartment = String(
    formData.get("customerDepartment") ?? ""
  ).trim();
  const customerReference = String(formData.get("customerReference") ?? "").trim();
  const termsAccepted = formData.get("terms") === "on";
  const sessionId = String(formData.get("sessionId") ?? "").trim();

  const fieldErrors: NonNullable<CheckoutState>["fieldErrors"] = {};
  if (customerName.length < 3) {
    fieldErrors.customerName = "Escribe tu nombre completo.";
  }
  if (!/^[+\d][\d\s()-]{6,17}$/.test(customerPhone)) {
    fieldErrors.customerPhone = "Escribe un teléfono válido (ej. 3001234567).";
  }
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    fieldErrors.customerEmail = "Correo electrónico inválido.";
  }
  if (customerAddress.length < 5) {
    fieldErrors.customerAddress = "Escribe tu dirección completa.";
  }
  if (customerNeighborhood.length < 2) {
    fieldErrors.customerNeighborhood = "Escribe tu barrio o sector.";
  }
  if (customerCity.length < 2) {
    fieldErrors.customerCity = "Escribe tu ciudad.";
  }
  if (!DEPARTMENTS.includes(customerDepartment as (typeof DEPARTMENTS)[number])) {
    fieldErrors.customerDepartment = "Selecciona tu departamento.";
  }
  if (!termsAccepted) {
    fieldErrors.terms =
      "Debes aceptar la política de tratamiento de datos y los términos y condiciones.";
  }

  const items = parseItems(String(formData.get("items") ?? ""));
  if (items.length === 0) {
    return { error: "Tu carrito está vacío. Agrega productos para continuar." };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ip = getClientIp(await headers());
  const limit = await rateLimit(`order:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.ok) {
    return {
      error:
        "Demasiados pedidos enviados desde esta conexión. Espera unos minutos antes de volver a intentarlo.",
    };
  }

  const variantIds = items.map((i) => i.productVariantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of items) {
    const variant = variantMap.get(item.productVariantId);
    if (!variant || !variant.product.active || variant.product.isDemo) {
      return { error: "Uno de los productos ya no está disponible." };
    }
    if (variant.stock <= 0 || variant.stockStatus === "agotado") {
      return { error: `"${variant.product.name}" está agotado.` };
    }
    if (item.quantity > variant.stock) {
      return {
        error: `Solo hay ${variant.stock} unidades disponibles de "${variant.product.name}".`,
      };
    }
  }

  const orderItems = items.map((item) => {
    const variant = variantMap.get(item.productVariantId)!;
    const unitPrice = variantPrice(variant.product, variant);
    return {
      productVariantId: variant.id,
      quantity: item.quantity,
      unitPrice,
      // Se congela el costo del proveedor al momento de la venta para poder
      // medir el margen real de cada pedido aunque después cambien los precios.
      unitCost: variant.product.supplierPrice,
    };
  });

  const subtotal = orderItems.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );
  const shippingCost = STORE_CONFIG.shippingCost;
  const total = subtotal + shippingCost;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        customerAddress,
        customerNeighborhood,
        customerCity,
        customerDepartment,
        customerReference: customerReference || null,
        status: "pendiente",
        total,
        subtotal,
        shippingCost,
        items: { create: orderItems },
      },
    });

    // Dropshipping: no tenemos inventario propio. El stock del producto es un
    // espejo de la disponibilidad del proveedor, así que NO se descuenta aquí;
    // lo decrementa el proveedor cuando procesa el pedido (o la sincronización
    // con Dropi cuando exista la integración). Lo que sí depende de nosotros es
    // la confirmación del pago contra entrega en la entrega.
    if (sessionId) {
      const cart = await tx.cart.findUnique({ where: { sessionId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    return created;
  });

  // Aviso por correo al dueño. Va DESPUÉS de la transacción, así que el pedido
  // ya está guardado y es real cuando se avisa. `after()` mantiene el aviso
  // vivo aunque Vercel corte la respuesta al navegador; y como notifyNewOrder
  // nunca lanza, un correo fallido no cambia el resultado del pedido.
  after(async () => {
    // Se reconstruyen los nombres desde variantMap, que ya está en memoria: los
    // items guardados solo llevan el precio, no el texto del producto.
    await notifyNewOrder({
      ...order,
      items: orderItems.map((item) => {
        const variant = variantMap.get(item.productVariantId)!;
        return {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          productVariant: {
            name: variant.name,
            sku: variant.sku,
            product: { name: variant.product.name },
          },
        };
      }),
    });
  });

  redirect(`/pedido/${order.id}`);
}
