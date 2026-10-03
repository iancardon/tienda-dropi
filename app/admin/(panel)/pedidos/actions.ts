"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, shortOrderId } from "@/lib/orders";
import { assertAdmin } from "@/lib/auth";

export async function setOrderStatus(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}

/**
 * Guarda los datos del proveedor de un pedido: con qué proveedor se tramita, el
 * número que nos da ese proveedor y el estado que nos informa. Se rellena a mano
 * hoy; es el sitio donde luego apoyará una integración real, sin integrarla aquí.
 *
 * Mantiene `dropiOrderId` porque el despliegue actual de Vercel todavía lee esa
 * columna, y deja las dos en sincronía para que nada se pierda al migrar.
 */
export async function updateProviderOrder(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const clean = (value: FormDataEntryValue | null): string | null => {
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
  };

  const providerOrderId = clean(formData.get("providerOrderId"));
  const providerName = clean(formData.get("providerName"));
  const providerStatus = clean(formData.get("providerStatus"));

  await prisma.order.update({
    where: { id },
    data: {
      providerOrderId,
      providerName,
      providerStatus,
      dropiOrderId: providerOrderId,
    },
  });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}

/**
 * Marca o quita la marca de pedido de prueba. No borra nada: sirve para poder
 * limpiar después los pedidos de prueba sin tocar los reales.
 */
export async function setOrderDemo(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const isDemo = String(formData.get("isDemo")) === "true";

  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return;

  await prisma.order.update({ where: { id }, data: { isDemo } });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}

/**
 * Elimina un pedido concreto. Para no borrar el pedido equivocado hay que
 * escribir su código corto. Los ítems se van en cascada.
 */
export async function deleteOrder(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const confirm = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (!id) return;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return;

  if (confirm !== shortOrderId(order.id)) {
    throw new Error(
      `Para eliminar este pedido escribe ${shortOrderId(order.id)} en el campo de confirmación.`
    );
  }

  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
}

/**
 * Borra únicamente los pedidos marcados como prueba. Por diseño nunca toca un
 * pedido que no tenga la marca, así que los pedidos reales están a salvo.
 */
export async function purgeDemoOrders(formData: FormData) {
  await assertAdmin();

  const confirm = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirm !== "ELIMINAR") {
    throw new Error("Para purgar los pedidos de prueba escribe ELIMINAR.");
  }

  const { count } = await prisma.order.deleteMany({ where: { isDemo: true } });
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  console.log(`Pedidos de prueba eliminados: ${count}`);
}
