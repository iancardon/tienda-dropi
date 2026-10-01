-- Marca los pedidos de prueba para poder limpiarlos sin tocar los reales.
ALTER TABLE "orders" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "orders_isDemo_idx" ON "orders" ("isDemo");

-- Proveedor y costo de envío del proveedor, para calcular el margen real.
ALTER TABLE "products" ADD COLUMN "supplier" TEXT NOT NULL DEFAULT 'Dropi';
ALTER TABLE "products" ADD COLUMN "supplierShippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
