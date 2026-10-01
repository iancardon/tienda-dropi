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

export async function updateDropiOrderId(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const dropiOrderId = String(formData.get("dropiOrderId") ?? "").trim();
  if (!id) return;

  await prisma.order.update({
    where: { id },
    data: { dropiOrderId: dropiOrderId === "" ? null : dropiOrderId },
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
