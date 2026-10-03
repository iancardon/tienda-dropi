-- Datos del proveedor en el pedido, en lugar del nombre de una sola plataforma.
-- Todo se añade como columna opcional: no se reescribe ni se borra ningún dato
-- existente, y `dropiOrderId` se queda para no romper el despliegue actual.
--
--   providerOrderId: el número que da el proveedor (el que antes era dropiOrderId)
--   providerName:    con qué proveedor se tramita el pedido
--   providerStatus:  el estado que informa el proveedor
ALTER TABLE "orders" ADD COLUMN     "providerName" TEXT,
ADD COLUMN     "providerOrderId" TEXT,
ADD COLUMN     "providerStatus" TEXT;

CREATE INDEX "orders_providerName_idx" ON "orders"("providerName");

-- Índice para encontrar un producto por su ID en el proveedor, que es como se
-- reconoce un producto real al reimportar el catálogo.
CREATE INDEX "products_supplier_supplierProductId_idx" ON "products"("supplier", "supplierProductId");