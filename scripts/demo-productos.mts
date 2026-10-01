import { PrismaClient } from "@prisma/client";

/**
 * Muestra u oculta los productos DEMO sin ejecutar el seed.
 *
 *   npm run demo:mostrar    -> los deja visibles en la tienda para tus pruebas
 *   npm run demo:ocultar    -> los deja ocultos (lo normal en producción)
 *
 * Solo cambia `active` de los productos con `isDemo = true`.
 * No borra ni modifica productos, variantes, pedidos, carritos o clientes.
 */

const prisma = new PrismaClient();
const accion = process.argv[2];

if (accion !== "--mostrar" && accion !== "--ocultar") {
  console.error("Uso: npx tsx scripts/demo-productos.mts --mostrar | --ocultar");
  process.exit(1);
}

const activo = accion === "--mostrar";

const { count } = await prisma.product.updateMany({
  where: { isDemo: true },
  data: { active: activo },
});

const visibles = await prisma.product.count({ where: { isDemo: true, active: true } });
console.log(
  `Productos DEMO actualizados: ${count} | ahora ${activo ? "visibles" : "ocultos"} en la tienda (${visibles} visibles)`
);
console.log("Los pedidos, carritos y variantes no se tocaron.");

await prisma.$disconnect();
