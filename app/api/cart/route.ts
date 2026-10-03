import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/** Lee el cuerpo JSON devolviendo 400 si viene malformado. */
async function readJson<T>(request: NextRequest): Promise<{
  data: T | null;
  error: NextResponse | null;
}> {
  try {
    return { data: (await request.json()) as T, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: "JSON inválido" }, { status: 400 }),
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ items: [] });
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: cart.items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ items: [], error: "Error al cargar carrito" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: body, error: jsonError } = await readJson<{
      sessionId?: string;
      productVariantId?: string;
      quantity?: number;
    }>(request);
    if (jsonError) return jsonError;
    const { sessionId, productVariantId, quantity = 1 } = body ?? {};

    if (!sessionId || !productVariantId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const limit = await rateLimit(
      `cart:add:${getClientIp(request.headers)}:${sessionId}`,
      30,
      60 * 1000
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: { product: true },
    });

    if (!variant || !variant.product.active || variant.product.isDemo) {
      return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
    }

    if (variant.stock <= 0 || variant.stockStatus === "agotado") {
      return NextResponse.json({ error: "Producto sin stock" }, { status: 400 });
    }

    if (quantity > variant.stock) {
      return NextResponse.json({ error: "Cantidad no disponible" }, { status: 400 });
    }

    let cart = await prisma.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId,
        },
      },
    });

    const newQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (newQuantity > variant.stock) {
      return NextResponse.json({ error: "Cantidad total excede stock disponible" }, { status: 400 });
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productVariantId,
          quantity,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Error al agregar al carrito" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { data: body, error: jsonError } = await readJson<{
      sessionId?: string;
      productVariantId?: string;
      quantity?: number;
    }>(request);
    if (jsonError) return jsonError;
    const { sessionId, productVariantId, quantity } = body ?? {};

    if (!sessionId || !productVariantId || quantity === undefined) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const limit = await rateLimit(
      `cart:update:${getClientIp(request.headers)}:${sessionId}`,
      60,
      60 * 1000
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    if (quantity < 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
    });

    if (!variant) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    if (quantity > 0 && quantity > variant.stock) {
      return NextResponse.json({ error: "Cantidad no disponible" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productVariantId,
        },
      });
    } else {
      await prisma.cartItem.upsert({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId,
          },
        },
        update: { quantity },
        create: {
          cartId: cart.id,
          productVariantId,
          quantity,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Error al actualizar carrito" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { data: body, error: jsonError } = await readJson<{
      sessionId?: string;
      productVariantId?: string;
      clear?: boolean;
    }>(request);
    if (jsonError) return jsonError;
    const { sessionId, productVariantId, clear } = body ?? {};

    if (!sessionId) {
      return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });
    }

    const limit = await rateLimit(
      `cart:remove:${getClientIp(request.headers)}:${sessionId}`,
      60,
      60 * 1000
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      return NextResponse.json({ success: true });
    }

    if (clear) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    } else if (productVariantId) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productVariantId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json({ error: "Error al eliminar del carrito" }, { status: 500 });
  }
}