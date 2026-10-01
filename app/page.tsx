import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  const steps = [
    {
      title: "Elige tu producto",
      description:
        "Revisa el catálogo y selecciona el producto y la variante que quieres.",
    },
    {
      title: "Te confirmamos por WhatsApp",
      description:
        "Llenas los datos de envío y un asesor te contacta para confirmar tu pedido.",
    },
    {
      title: "Pagas al recibir",
      description:
        "El mensajero llega a tu puerta y pagas el valor total en efectivo.",
    },
  ];

  return (
    <>
      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Lo que pidas, lo pagas cuando lo recibes
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">
            Compra fácil en todo Colombia. No pagas nada por adelantado: el
            pago se hace contra entrega.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/productos"
              className="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Ver productos
            </Link>
            <Link
              href="#como-funciona"
              className="rounded-xl border border-zinc-300 px-8 py-3 font-semibold text-zinc-800 transition hover:border-emerald-400"
            >
              Cómo funciona
            </Link>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">Productos destacados</h2>
            <Link
              href="/productos"
              className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
            >
              Ver todo
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section id="como-funciona" className="border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold">
            ¿Cómo funciona el pago contra entrega?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}