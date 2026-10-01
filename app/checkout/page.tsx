import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getImages } from "@/lib/products";
import { CheckoutForm, type CheckoutItem } from "./checkout-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirma tu pedido con pago contra entrega. No pagas por adelantado.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const variantId =
    typeof params.variant === "string" ? params.variant : undefined;
  const sessionParam =
    typeof params.session === "string" ? params.session : undefined;

  let items: CheckoutItem[] = [];
  let sessionId: string | undefined;
  let editableQty = false;

  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || !variant.product.active) {
      notFound();
    }

    const qtyParam =
      typeof params.qty === "string" ? parseInt(params.qty, 10) : 1;
    const qty = Number.isFinite(qtyParam)
      ? Math.min(Math.max(qtyParam, 1), Math.max(variant.stock, 1))
      : 1;

    const unitPrice = variant.priceOverride ?? variant.product.basePrice;
    items = [
      {
        variantId: variant.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        productImage: getImages(variant.product.images)[0],
        variantName: variant.name,
        unitPrice,
        quantity: qty,
        stock: variant.stock,
      },
    ];
    editableQty = true;
  } else if (sessionParam) {
    sessionId = sessionParam;
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            productVariant: { include: { product: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const cartItems = (cart?.items ?? []).filter(
      (ci) => ci.productVariant.product.active
    );

    if (cartItems.length === 0) {
      redirect("/carrito");
    }

    items = cartItems.map((ci) => {
      const variant = ci.productVariant;
      return {
        variantId: variant.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        productImage: getImages(variant.product.images)[0],
        variantName: variant.name,
        unitPrice: variant.priceOverride ?? variant.product.basePrice,
        quantity: ci.quantity,
        stock: variant.stock,
      };
    });
  } else {
    redirect("/productos");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Finalizar pedido</h1>
      <p className="mt-1 text-zinc-500">
        Sin pago online: pagas en efectivo cuando recibes tu pedido.
      </p>

      <div className="mt-8">
        <CheckoutForm
          items={items}
          sessionId={sessionId}
          editableQty={editableQty}
        />
      </div>

      <p className="mt-8 text-center text-xs text-zinc-400">
        Al confirmar aceptas ser contactado por WhatsApp para validar los datos
        de entrega.{" "}
        <Link href="/productos" className="underline">
          Seguir comprando
        </Link>
      </p>
    </div>
  );
}
