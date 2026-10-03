import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { CatalogEmpty } from "@/components/catalog-empty";
import { SectionHeading } from "@/components/section-heading";
import { Faq, type FaqItem } from "@/components/faq";
import {
  IconBox,
  IconCash,
  IconChat,
  IconHeart,
  IconRotate,
  IconShield,
  IconTruck,
  IconWhatsApp,
} from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { STORE_CONFIG, getWhatsAppUrl } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  // `isDemo: false` impide que un producto de prueba se publique por error.
  const [featured, offers, allProducts] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, isDemo: false, featured: true },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: {
        active: true,
        isDemo: false,
        originalPrice: { not: null },
      },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { active: true, isDemo: false },
      select: { id: true, category: true },
    }),
  ]);

  // Se muestran los destacados si existen; si no, los productos más recientes
  // para que la portada nunca quede vacía.
  const spotlight = featured.length > 0
    ? featured
    : allProducts.length > 0
      ? await prisma.product.findMany({
          where: { active: true, isDemo: false },
          include: { variants: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : [];

  const categories = buildCategories(allProducts);
  const hasCatalog = spotlight.length > 0 || offers.length > 0;

  return (
    <>
      <Hero />
      <TrustBar />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <SectionHeading
          eyebrow="Catálogo"
          title="Productos destacados"
          subtitle="Lo que másPedimos esta semana. Paga en efectivo cuando lo recibas, sin pagos por adelantado."
          action={
            spotlight.length > 0 ? (
              <Link
                href="/productos"
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Ver todo →
              </Link>
            ) : undefined
          }
        />

        <div className="mt-7">
          {spotlight.length > 0 ? (
            <div className="grid-products grid gap-3 sm:gap-4 lg:gap-5">
              {spotlight.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            <CatalogEmpty />
          )}
        </div>
      </section>

      {offers.length > 0 && (
        <section className="border-y border-zinc-200 bg-zinc-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
            <SectionHeading
              eyebrow="Precio rebajado"
              title="Ofertas"
              subtitle="Descuentos por tiempo limitado sobre el precio anterior."
              action={
                <Link
                  href="/productos?ofertas=1"
                  className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Ver ofertas →
                </Link>
              }
            />
            <div className="mt-7 grid-products grid gap-3 sm:gap-4 lg:gap-5">
              {offers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <SectionHeading
            eyebrow="Explora"
            title="Categorías"
            subtitle="Encuentra rápido lo que buscas."
          />
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/productos?categoria=${encodeURIComponent(category.name)}`}
                className="group flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-4 transition hover:border-emerald-400 hover:shadow-sm"
              >
                <span className="text-sm font-semibold text-zinc-900 transition group-hover:text-emerald-700">
                  {category.name}
                </span>
                <span className="shrink-0 text-xs font-medium text-zinc-400">
                  {category.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <HowItWorks />
      <Benefits />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <SectionHeading
          eyebrow="Ayuda"
          title="Preguntas frecuentes"
          subtitle="Las dudas más comunes sobre el pago contra entrega y los envíos."
          align="center"
        />
        <div className="mt-7">
          <Faq items={FAQ_ITEMS} />
        </div>
      </section>

      <FinalCta hasCatalog={hasCatalog} />
    </>
  );
}

/**
 * Agrupa por categoría usando el mismo criterio que el menú de la cabecera,
 * que solo muestra categorías de productos publicados.
 */
function buildCategories(products: { id: string; category: string }[]) {
  const counts = new Map<string, number>();

  for (const product of products) {
    const name = product.category?.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
    .slice(0, 12);
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
      {/* Fondo muy sobrio: apenas un halo de color para dar profundidad, sin
          degradado que compita con el texto. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 30rem at 50% -20%, #ecfdf5 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/20">
            <IconCash className="h-3.5 w-3.5" />
            Pago contra entrega en toda Colombia
          </p>

          <h1 className="mt-5 text-3xl leading-tight font-black tracking-tight text-balance text-zinc-900 sm:text-5xl lg:text-[3.25rem]">
            Lo que pidas, lo pagas cuando lo recibes
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-pretty text-zinc-600 sm:text-lg">
            Pide lo que necesites, paga en efectivo al recibirlo y recibe en la
            puerta de tu casa. Sin pagos por adelantado.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/productos"
              className="w-full rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
            >
              Ver productos
            </Link>
            {STORE_CONFIG.whatsapp && (
              <a
                href={getWhatsAppUrl(
                  `Hola, quiero hacer una consulta sobre ${STORE_CONFIG.name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-8 py-3.5 text-base font-semibold text-zinc-800 transition hover:border-emerald-400 hover:text-emerald-700 sm:w-auto"
              >
                <IconWhatsApp className="h-5 w-5 text-emerald-600" />
                Escríbenos
              </a>
            )}
          </div>

          <p className="mt-6 text-xs text-zinc-500 sm:text-sm">
            Pagas cuando recibes · Envíos a todo el país · Confirmación por
            WhatsApp
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    {
      icon: <IconCash className="h-5 w-5" />,
      title: "Paga al recibir",
      detail: "Nada por adelantado",
    },
    {
      icon: <IconTruck className="h-5 w-5" />,
      title: "Envíos a todo el país",
      detail: "Ciudades y municipios",
    },
    {
      icon: <IconChat className="h-5 w-5" />,
      title: "Confirmación por WhatsApp",
      detail: "Te escribimos antes de enviar",
    },
    {
      icon: <IconShield className="h-5 w-5" />,
      title: "Compra sin riesgo",
      detail: "Revisas antes de pagar",
    },
  ];

  return (
    <section className="border-b border-zinc-200 bg-zinc-50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-7 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-zinc-200/70">
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] leading-tight font-semibold text-zinc-900 sm:text-sm">
                {item.title}
              </span>
              <span className="block text-[11px] leading-tight text-zinc-500 sm:text-xs">
                {item.detail}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <IconBox className="h-5 w-5" />,
      title: "Elige tu producto",
      description:
        "Revisa el catálogo y selecciona el producto y la variante que quieres.",
    },
    {
      icon: <IconWhatsApp className="h-5 w-5" />,
      title: "Te confirmamos por WhatsApp",
      description:
        "Llenas los datos de envío y un asesor te contacta para confirmar tu pedido.",
    },
    {
      icon: <IconCash className="h-5 w-5" />,
      title: "Pagas al recibir",
      description:
        "El mensajero llega a tu puerta y pagas el valor total en efectivo.",
    },
  ];

  return (
    <section id="como-funciona" className="border-y border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="Pedir es más fácil de lo que parece"
          subtitle="Tres pasos y listo. El pago se hace cuando el pedido llega a tus manos."
          align="center"
        />

        <ol className="mt-9 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  {step.icon}
                </span>
                <span className="text-3xl font-black text-zinc-100">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      icon: <IconCash className="h-5 w-5" />,
      title: "No pagas por adelantado",
      description:
        "Sin tarjeta y sin transferencias. Pagas en efectivo cuando recibes el pedido.",
    },
    {
      icon: <IconTruck className="h-5 w-5" />,
      title: "Envíos a toda Colombia",
      description:
        "Despachamos a ciudades principales, municipios y zonas rurales según cobertura.",
    },
    {
      icon: <IconChat className="h-5 w-5" />,
      title: "Te avisamos por WhatsApp",
      description:
        "Confirmamos tu pedido y te enviamos el número de guía cuando sale.",
    },
    {
      icon: <IconHeart className="h-5 w-5" />,
      title: "Solo productos reales",
      description:
        "Solo mostramos productos que existen y se pueden entregar. Nada de catálogo vacío.",
    },
    {
      icon: <IconRotate className="h-5 w-5" />,
      title: "Cambios y devoluciones",
      description:
        "Tienes derecho a solicitar cambio o devolución siguiendo nuestra política.",
    },
    {
      icon: <IconShield className="h-5 w-5" />,
      title: "Datos protegidos",
      description:
        "Usamos tus datos solo para procesar y entregar tu pedido.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <SectionHeading
        eyebrow="Por qué comprarnos"
        title="Una compra sin sorpresas"
        align="center"
      />

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              {item.icon}
            </span>
            <h3 className="mt-3.5 text-[15px] font-bold text-zinc-900">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ hasCatalog }: { hasCatalog: boolean }) {
  return (
    <section className="border-t border-zinc-200 bg-emerald-700">
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-14">
        <h2 className="text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl">
          {hasCatalog
            ? "¿Listo para hacer tu pedido?"
            : "¿Quieres saber más mientras cargamos el catálogo?"}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-pretty text-emerald-50">
          {hasCatalog
            ? "Elige tu producto y confirma el pedido. Pagas en efectivo cuando lo recibas."
            : "Escríbenos y te respondemos por WhatsApp. Te avisamos en cuanto abramos el catálogo."}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {hasCatalog && (
            <Link
              href="/productos"
              className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:w-auto"
            >
              Ver productos
            </Link>
          )}
          {STORE_CONFIG.whatsapp && (
            <a
              href={getWhatsAppUrl(
                `Hola, quiero hacer un pedido en ${STORE_CONFIG.name}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/80 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              <IconWhatsApp className="h-5 w-5" />
              Pedir por WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "¿Tengo que pagar por adelantado?",
    answer:
      "No. Todo el pedido, incluido el envío, se paga en efectivo cuando recibes el paquete. No pedimos tarjeta, consignación ni transferencia previa.",
  },
  {
    question: "¿Cómo confirmo mi pedido?",
    answer:
      "Al finalizar el formulario de compra te escribimos por WhatsApp para confirmar tus datos de entrega. Tu pedido queda confirmado cuando respondemos ese mensaje.",
  },
  {
    question: "¿A dónde hacen envíos?",
    answer: "Realizamos envíos a toda Colombia según cobertura del transportador.",
    link: { href: "/envios", label: "Ver política de envíos" },
  },
  {
    question: "¿Cuánto demora el envío?",
    answer:
      "Las unidades se despachan una vez confirmado el pedido. El tiempo de entrega depende del destino y de la transportadora; te enviamos el número de guía por WhatsApp para que hagas seguimiento.",
  },
  {
    question: "¿Puedo pagar con tarjeta?",
    answer:
      "Por ahora el único método de pago es efectivo contra entrega. No procesamos pagos con tarjeta ni por medios virtuales.",
  },
  {
    question: "¿Qué pasa si quiero devolver un producto?",
    answer:
      "Puedes solicitar cambio o devolución. Revisa las condiciones y el procedimiento antes de pedir.",
    link: { href: "/cambios-y-devoluciones", label: "Ver cambios y devoluciones" },
  },
];