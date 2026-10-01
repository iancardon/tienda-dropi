import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Los productos de este seed son de PRUEBAS: no son productos reales.
// Por eso quedan marcados como demo y ocultos en la tienda pública.
// Para probarlos en local:  SEED_DEMO_ACTIVE=true npm run db:seed
const demoActive = process.env.SEED_DEMO_ACTIVE === "true";

async function main() {
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  const products = [
    {
      name: "Audífonos Inalámbricos Pro",
      slug: "audifonos-inalambricos-pro",
      shortDescription: "Bluetooth con cancelación de ruido, 30h batería",
      description:
        "Audífonos bluetooth con cancelación de ruido activa, 30 horas de batería y estuche de carga rápida. Compatibles con iOS y Android. Incluyen micrófono integrado para llamadas y control táctil.",
      category: "Tecnología",
      basePrice: 89000,
      originalPrice: 119000,
      discountPercent: 25,
      supplierPrice: 42000,
      supplierProductId: "dropi-1001",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
      ],
      featured: true,
      variants: [
        { name: "Negro", sku: "AUD-PRO-NEG", priceOverride: null, stock: 50, stockStatus: "disponible" },
        { name: "Blanco", sku: "AUD-PRO-BLA", priceOverride: null, stock: 30, stockStatus: "disponible" },
        { name: "Azul", sku: "AUD-PRO-AZU", priceOverride: 94000, stock: 0, stockStatus: "agotado" },
      ],
    },
    {
      name: "Lámpara LED Solar 3 Modos",
      slug: "lampara-led-solar",
      shortDescription: "Recargable, 3 modos, resistente IP65",
      description:
        "Lámpara recargable con panel solar para exteriores o interiores. Tres modos de luz (alta, media, parpadeo), resistente al agua IP65. Ideal para camping, jardín o emergencias. Carga solar y USB.",
      category: "Hogar",
      basePrice: 58000,
      originalPrice: 78000,
      discountPercent: 25,
      supplierPrice: 23000,
      supplierProductId: "dropi-1002",
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop",
      ],
      featured: true,
      variants: [
        { name: "Blanco", sku: "LMP-SOL-BLA", priceOverride: null, stock: 25, stockStatus: "disponible" },
      ],
    },
    {
      name: "Multifuncional de Cocina 12 en 1",
      slug: "multifuncional-cocina-12-en-1",
      shortDescription: "12 accesorios, 1200W, pica/bate/amasa",
      description:
        "Robot de cocina con 12 accesorios intercambiables: pica, bate, amasa, ralla, exprime y más. 1200W de potencia, 3 velocidades + pulso. Bowl de 3.5L. Incluye libro de recetas.",
      category: "Hogar",
      basePrice: 265000,
      originalPrice: 320000,
      discountPercent: 17,
      supplierPrice: 111000,
      supplierProductId: "dropi-1003",
      images: [
        "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1511378245014-916b726f774b?w=800&h=800&fit=crop",
      ],
      featured: true,
      variants: [
        { name: "Gris", sku: "COC-12-1-GRI", priceOverride: null, stock: 15, stockStatus: "disponible" },
        { name: "Rojo", sku: "COC-12-1-ROJ", priceOverride: null, stock: 10, stockStatus: "disponible" },
      ],
    },
    {
      name: "Organizador de Mascotas Portátil",
      slug: "organizador-mascotas-portatil",
      shortDescription: "Transportador plegable con ventana malla",
      description:
        "Bolso transportador plegable para mascotas pequeñas (hasta 8kg). Correa ajustable, ventana de malla transpirable, base acolchada extraíble. Se pliega plano para guardar. Ideal para vet, viajes.",
      category: "Mascotas",
      basePrice: 74000,
      originalPrice: 95000,
      discountPercent: 22,
      supplierPrice: 31000,
      supplierProductId: "dropi-1004",
      images: [
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=800&fit=crop",
      ],
      featured: false,
      variants: [
        { name: "Café", sku: "MAS-PORT-CAF", priceOverride: null, stock: 20, stockStatus: "disponible" },
        { name: "Gris", sku: "MAS-PORT-GRI", priceOverride: null, stock: 0, stockStatus: "agotado" },
      ],
    },
    {
      name: "Cargador Inalámbrico Rápido 15W",
      slug: "cargador-inalambrico-rapido-15w",
      shortDescription: "Qi-certificado, 15W, LED indicador",
      description:
        "Cargador inalámbrico certificado Qi con carga rápida 15W. Compatible con iPhone 12+, Samsung Galaxy, Pixel y más. LED indicador de estado, protección contra sobrecalentamiento. Incluye cable USB-C 1m.",
      category: "Tecnología",
      basePrice: 45000,
      originalPrice: 65000,
      discountPercent: 30,
      supplierPrice: 18000,
      supplierProductId: "dropi-1005",
      images: [
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop",
      ],
      featured: false,
      variants: [
        { name: "Negro", sku: "CHG-15W-NEG", priceOverride: null, stock: 40, stockStatus: "disponible" },
        { name: "Blanco", sku: "CHG-15W-BLA", priceOverride: null, stock: 35, stockStatus: "disponible" },
      ],
    },
    {
      name: "Set de Cuchillos Cocina 6 Piezas",
      slug: "set-cuchillos-cocina-6-piezas",
      shortDescription: "Acero inoxidable, bloque madera, afilador",
      description:
        "Set profesional de 6 cuchillos de acero inoxidable alto carbono: chef, pan, filetear, deshuesar, pelador y tijeras. Bloque de madera de acacia con afilador integrado. Mangos ergonómicos antideslizantes.",
      category: "Hogar",
      basePrice: 120000,
      originalPrice: 160000,
      discountPercent: 25,
      supplierPrice: 55000,
      supplierProductId: "dropi-1006",
      images: [
        "https://images.unsplash.com/photo-1654064756910-974764816931?w=800&h=800&fit=crop",
      ],
      featured: true,
      variants: [
        { name: "Negro/Acero", sku: "KNIFE-SET-01", priceOverride: null, stock: 12, stockStatus: "disponible" },
      ],
    },
    {
      name: "Masajeador Cervical Portátil",
      slug: "masajeador-cervical-portatil",
      shortDescription: "3D, calor, 6 modos, batería 2000mAh",
      description:
        "Masajeador cervical con tecnología 3D que simula manos humanas. 6 modos de masaje, 15 niveles de intensidad, función calor (42°C). Batería 2000mAh para 4h uso. Diseño ergonómico en U, portátil.",
      category: "Cuidado Personal",
      basePrice: 135000,
      originalPrice: 180000,
      discountPercent: 25,
      supplierPrice: 62000,
      supplierProductId: "dropi-1007",
      images: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=800&fit=crop",
      ],
      featured: false,
      variants: [
        { name: "Gris", sku: "MAS-NEC-GRY", priceOverride: null, stock: 8, stockStatus: "disponible" },
        { name: "Rosa", sku: "MAS-NEC-PNK", priceOverride: null, stock: 5, stockStatus: "bajo_stock" },
      ],
    },
    {
      name: "Funda Celular Anti-Golpes Magnética",
      slug: "funda-celular-anti-golpes-magnetica",
      shortDescription: "MagSafe compatible, protección militar",
      description:
        "Funda con tecnología MagSafe integrada, imanes de alta precisión. Certificación militar MIL-STD-810G contra caídas 3m. Borde elevado protege cámara y pantalla. Compatible carga inalámbrica.",
      category: "Accesorios Celular",
      basePrice: 38000,
      originalPrice: 55000,
      discountPercent: 30,
      supplierPrice: 15000,
      supplierProductId: "dropi-1008",
      images: [
        "https://images.unsplash.com/photo-1601593346740-925612772716?w=800&h=800&fit=crop",
      ],
      featured: false,
      variants: [
        { name: "Transparente", sku: "CASE-MAG-CLR", priceOverride: null, stock: 60, stockStatus: "disponible" },
        { name: "Negro Mate", sku: "CASE-MAG-BLK", priceOverride: null, stock: 45, stockStatus: "disponible" },
        { name: "Azul Oscuro", sku: "CASE-MAG-BLU", priceOverride: null, stock: 30, stockStatus: "disponible" },
      ],
    },
  ];

  for (const product of products) {
    const { variants, ...data } = product;
    await prisma.product.create({
      data: {
        ...data,
        isDemo: true,
        active: demoActive,
        variants: {
          create: variants.map((v) => ({
            ...v,
            // El stock es un espejo de la disponibilidad del proveedor.
            stockStatus: demoActive ? v.stockStatus : "agotado",
          })),
        },
      },
    });
  }

  const count = await prisma.product.count();
  console.log(`Seed completado: ${count} productos DEMO creados.`);
  console.log(
    demoActive
      ? "Productos DEMO visibles en la tienda (solo para pruebas locales)."
      : "Productos DEMO ocultos en la tienda. Usa SEED_DEMO_ACTIVE=true para verlos."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });