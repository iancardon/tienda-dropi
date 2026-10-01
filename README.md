# Tienda Dropi (documentación del proyecto)

Tienda de pago contra entrega (COD) en español. Next.js 16, React 19, Prisma y PostgreSQL.

## Modelo de negocio: dropshipping

No tenemos inventario propio. Vendemos productos de proveedores externos y el
proveedor procesa, prepara y despacha cada pedido.

Consecuencias en el sistema:

- El `stock` de cada variante es un **espejo de la disponibilidad del proveedor**,
  no un inventario propio. Sirve para no ofrecer algo agotado.
- Al crear un pedido **no se descuenta stock**: lo descuenta el proveedor cuando
  procesa el envío (o la futura sincronización con Dropi). Verificado en
  `app/checkout/actions.ts`.
- El checkout **sí** valida que la cantidad no supere la disponibilidad conocida.
- El costo del proveedor (`supplierPrice`) **nunca** se muestra en la tienda; solo
  en el panel.
- El costo se congela en cada ítem del pedido (`order_items.unitCost`) para poder
  medir la utilidad real aunque después cambien los precios.
- La confirmación del pago ocurre en la entrega (contra entrega). No hay pasarela
  de pago por ahora.

## Productos DEMO

El seed crea **8 productos de prueba** que no son productos reales. Para que nunca
se publiquen como si fueran reales:

- quedan marcados con `isDemo = true` y se muestran como "DEMO · solo pruebas" en el panel;
- se crean **ocultos** (`active = false`), así que no aparecen en la tienda, ni en el
  detalle (404), ni en el sitemap;
- su stock es ilustrativo (dos variantes salen agotadas a propósito para poder probar
  ese estado) y sus precios no son reales.

Para verlos mientras pruebas en local **sin tocar tus pedidos reales**:

```bash
npm run demo:mostrar     # los hace visibles en la tienda
npm run demo:ocultar     # los vuelve a ocultar (lo normal en producción)
```

Ambos comandos solo cambian `active` de los productos con `isDemo = true`. **No
ejecutes `npm run db:seed` para esto**: el seed borra y recrea productos, variantes,
pedidos y carritos, así que se lleva por delante los pedidos reales que tengas. Úsalo
solo para reiniciar el catálogo de pruebas desde cero.

Los productos DEMO se conservan en la base de datos y siguen visibles **en el panel
admin**, marcados como "Oculto" y "DEMO · solo pruebas", para que puedas consultarlos y
reactivarlos cuando quieras. En la tienda pública no aparecen: ni en el listado, ni
en el detalle (404), ni en el sitemap.

Cuando importes el catálogo real (`npm run import:productos ... --apply`), los
productos que coincidan por slug dejan de ser DEMO automáticamente.

## Pedidos de prueba (marcar y limpiar)

Mientras pruebas, los pedidos que haces tú mismo se pueden **marcar como pruebas** y
deshacer después. Sirve para limpiar el panel sin arriesgar un pedido real:

- En cada fila del listado hay un botón para **marcar/desmarcar** el pedido como
  prueba (`orders.isDemo`). Los de prueba salen con la etiqueta "prueba".
- El listado tiene filtros: **Todos**, **Solo pruebas** y **Solo reales**.
- En el detalle de cada pedido hay una zona de eliminación que pide escribir el
  **ID corto** del pedido (ej. `ABC123`) antes de confirmar.
- El botón **"Borrar todos los pedidos de prueba"** solo borra los que están
  marcados como prueba y pide escribir `ELIMINAR`. Nunca toca un pedido real, y el
  botón desaparece cuando no queda ninguno.
- Para dejar el panel limpio, marca como prueba lo que quieras descartar y usa ese
  botón. Los pedidos reales (`isDemo = false`) quedan intactos.

## Márgenes (precio de venta, costo y margen)

- El margen se calcula **sobre el precio de venta**: `(venta - costo) / venta`.
- `MIN_MARGIN_PERCENT = 20` en `lib/pricing.ts` es el margen mínimo recomendado.
- En el formulario de producto se muestra el margen en vivo, con aviso si vendes
  por debajo del costo o por debajo del mínimo, y el precio de venta sugerido.
- En el listado de productos verás venta, costo y margen en COP y %, más un
  resumen de cuántos productos están listos para el proveedor y cuántos tienen
  margen bajo.
- En el detalle de cada pedido: venta, costo del proveedor, envío que pagas tú y
  **utilidad estimada** (ya descontando el envío, que no lo cubre el proveedor).
- Cada producto guarda además `supplier` (por defecto `Dropi`), `supplierPrice`
  (costo de compra), `supplierShippingCost` (lo que cobra el proveedor por envío) y
  `supplierProductId` (referencia del producto en el proveedor). El costo total que
  pagas al proveedor es `supplierPrice + supplierShippingCost`, y el panel te dice
  cuántos productos están "listos para el proveedor" (con imagen, variantes y stock).
  El checkout sigue cobrando al cliente solo lo definido en `SHIPPING_COST`.

Ojo: el envío lo pagas tú, así que la utilidad real siempre es menor que el margen
bruto del producto.

## Estados de pedido

Flujo normal:

`pendiente` → `confirmado` → `preparando` → `enviado` → `entregado`

Estados alternativos:

| Estado | Significado |
| --- | --- |
| `cancelado` | El cliente lo cancela o no hay respuesta |
| `devolucion` | El cliente lo devuelve (agrega el motivo en notas internas) |
| `rechazado` | El cliente lo recibe pero lo rechaza por daño o error |

En el panel, cada pedido muestra el **siguiente paso sugerido**, el número de
WhatsApp para confirmar, un botón de copiar el resumen del pedido y si ya tiene
identificador del proveedor. El proceso manual es:

1. Confirmas por WhatsApp y marcas `confirmado`.
2. Creas el pedido en el proveedor y pegas su número de pedido.
3. Marcas `enviado` y compartes el enlace de seguimiento si lo hay.
4. Al entregar y cobrar, marcas `entregado` y el pedido queda como histórico.

## Pedidos y WhatsApp

El detalle de cada pedido (`/admin/pedidos/[id]`) reúne todo lo necesario para
trabajar el pedido sin salir del panel:

- Datos del cliente y entrega: nombre, teléfono, correo, dirección, barrio, ciudad,
  departamento, referencia de entrega y método de pago.
- Productos con su variante, SKU, unidades, precio de venta, costo del proveedor y
  el total por línea.
- Totales: subtotal, envío (que pagas tú) y total a cobrar al cliente, más el margen
  y la utilidad estimada del pedido.
- `ID pedido en el proveedor`: el número que copiaste de Dropi, y **copiar** con un
  clic. Los estados del flujo y las fechas también están a la vista.
- **Copiar resumen**: dos botones que generan el mensaje listo para pegar.
  1. *Al cliente*: confirma el pedido, lista los productos con `precio x cantidad =
     subtotal`, el envío, el total a pagar contra entrega y la dirección.
  2. *Al proveedor*: genera el texto para crear el pedido en Dropi con los datos de
     entrega, el total que debe cobrar el proveedor y las referencias de tus
     productos.
- **Enviar por WhatsApp** abre un chat con el cliente (`wa.me`) con el mensaje del
  cliente ya escrito. Es un enlace: no hay API ni tokens de por medio. El mensaje al
  proveedor se copia y pegas a mano, porque no hay integración automática.

## Integración con Dropi (pendiente)

**Hoy no hay ninguna integración automática con Dropi.** No existe todavía el
endpoint ni las credenciales, así que la tienda no inventa ni simula esa
conexión. Lo que sí está preparado:

- `scripts/plantilla-dropi.csv` con los encabezados de la importación, sin datos
  inventados. Completa una fila por producto/variante.
- El importador acepta el `id_proveedor` (`id_dropi`) para guardar el
  identificador del producto en el proveedor.
- En el panel, cada producto muestra un checklist de lo que falta para poder
  enviarlo al proveedor: identificador, costo, imagen, variantes con SKU,
  disponibilidad y que no sea DEMO.
- `lib/supplier.ts` centraliza la lógica del checklist y el nombre del proveedor,
  para que el día de la integración solo haya que añadir el cliente de la API.

Cuando tengas el catálogo real y la documentación de la API, los siguientes pasos
serían: (1) importar el CSV real, (2) implementar la autenticación y el envío de
pedidos, y (3) sincronizar la disponibilidad para actualizar `stock` y
`stockStatus`, que hoy se actualizan a mano.

## Nombre de la marca

La tienda se llama lo que digas en `NEXT_PUBLIC_STORE_NAME` (por defecto `MiTienda`).
Ese valor se usa en el header, el footer, el título de las páginas, los metadatos
(SEO) y los mensajes de WhatsApp, así que **no hay que cambiar el nombre en el código**.

```bash
NEXT_PUBLIC_STORE_NAME=MiTienda
```

Ojo: al ser `NEXT_PUBLIC_`, el valor queda incrustado en el bundle del navegador. Si
lo cambias en `.env` tienes que **recompilar** (`npm run build`) y volver a arrancar;
si solo cambias el archivo, seguirá el nombre viejo.

## Páginas legales

Hay cuatro páginas legales enlazadas desde el footer y cruzadas entre sí:

| Ruta | Contenido |
| --- | --- |
| `/politica-de-privacidad` | Tratamiento de datos personales (Ley 1581 de 2012 y Decreto 1074 de 2015), derechos del titular y reclamaciones ante la SIC. |
| `/terminos-y-condiciones` | Condiciones de compra, pago contra entrega, envíos, garantías, responsabilidad y jurisdicción. |
| `/cambios-y-devoluciones` | Retracto, garantía legal, cambios, procedimiento, reembolsos, excepciones y costos de envío. |
| `/contacto` | WhatsApp, correo, teléfono y horario de atención. |

Los textos son genéricos y **no son asesoría jurídica**. Mientras falten datos por
definir, cada página muestra arriba un aviso "Documento sin completar" y marca los
campos como `[[COMPLETAR: ...]]`, para que no se publique un documento con datos
inventados.

Para completar los que salen de variables, edita `.env`:

| Campo en la página | Variable |
| --- | --- |
| Nombre comercial | `NEXT_PUBLIC_STORE_NAME` |
| Responsable del tratamiento | `STORE_RESPONSIBLE` |
| Domicilio | `STORE_ADDRESS` |
| Correo | `STORE_EMAIL` |
| Teléfono | `STORE_PHONE` |
| WhatsApp | `STORE_WHATSAPP` |

Los que no tienen variable (NIT, correo de privacidad, horarios, plazo de
conservación y juzgado competente) se editan directamente en el texto de la página.
El aviso desaparece solo cuando todo está completo.

Las rutas antiguas (`/terminos`, `/devoluciones`, `/politica-de-datos`) siguen
funcionando y redirigen a las nuevas, así que no se rompen enlaces guardados.

## Casilla de consentimiento en el checkout

El checkout exige marcar **"Acepto la política de tratamiento de datos y los
términos"** antes de confirmar. La casilla es `required` en el navegador y además se
valida en el servidor (`app/checkout/actions.ts`): si no llega marcada, se devuelve
el error y **no se crea ningún pedido**. Los enlaces abren en una pestaña aparte para
no perder los datos que ya escribió el cliente.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` / `npm run build` | Lint y build de producción |
| `npm run secret:admin` | Genera un `ADMIN_SECRET` aleatorio y largo |
| `npm run db:deploy` | Aplica migraciones (`prisma migrate deploy`) |
| `npm run db:seed` | **Destructivo**: borra carritos, pedidos, variantes y productos, y carga los 8 productos de demo |
| `npm run db:studio` | Prisma Studio |
| `npm run demo:mostrar` / `demo:ocultar` | Muestra u oculta los productos de ejemplo |
| `npm run import:productos` | Importa/actualiza productos desde un CSV (ver abajo) |

## Variables de entorno

Copia `.env.example` a `.env` y cambia los valores. **`.env` está en `.gitignore`, nunca
lo subas**; `.env.example` sí se versiona y es la lista completa de variables con
valores falsos.

- Obligatorias: `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET`.
- Marca: `NEXT_PUBLIC_STORE_NAME` (requiere recompilar) y `NEXT_PUBLIC_SITE_URL`.
- Contacto: `STORE_TAGLINE`, `STORE_WHATSAPP`, `STORE_EMAIL`, `STORE_PHONE`,
  `STORE_ADDRESS`, `STORE_RESPONSIBLE`.
- Negocio: `SHIPPING_COST`, `UPLOADS_DIR`, `SOCIAL_*`, `SEED_DEMO_ACTIVE`.

**La app no arranca en producción con credenciales inseguras.** `instrumentation.ts`
valida la configuración al arrancar y detiene el servidor si `ADMIN_PASSWORD` o
`ADMIN_SECRET` están vacíos, son demasiado cortos o conservan un valor de ejemplo.
No imprime el valor del secreto, solo qué variable hay que corregir. Genera uno
nuevo con `npm run secret:admin`.

## Imágenes de producto

En el admin, el formulario de producto permite **subir archivos** además de pegar URLs.

- `POST /api/admin/upload` (solo sesión admin): acepta JPG, PNG, WEBP o AVIF de hasta
  5 MB, valida los bytes reales de la imagen y genera un nombre UUID.
- Se guardan en `uploads/productos/` (configurable con `UPLOADS_DIR`) y se sirven desde
  la ruta `/uploads/productos/...`.
- La primera imagen es la principal; se puede reordenar o quitar.
- Las imágenes y la carpeta `uploads/` están en `.gitignore`.
- **Al desplegar en Vercel u otro hosting serverless** el disco es efímero: hay que
  mover el almacenamiento a un bucket (S3/Vercel Blob) y servir desde allí.
- Las imágenes remotas se optimizan con `next/image`. Los hosts permitidos están en
  `next.config.ts` (`images.remotePatterns`): `images.unsplash.com` y `picsum.photos`.
  Si usas otro proveedor (Cloudinary, tu bucket…), **agrégalo ahí** o las imágenes no
  aparecerán.
- Si una URL está caída o bloqueada, `components/smart-image.tsx` muestra un aviso
  elegante en vez de un ícono de imagen rota. Aun así, corrige la URL: revisa que
  responda `200` antes de guardar el producto.

## Importar productos desde CSV

```bash
npm run import:productos -- catalogo.csv            # simulación (no escribe)
npm run import:productos -- catalogo.csv --apply    # escribe en la base de datos
```

Opciones: `--apply`, `--skip-invalid` (omite filas con error en vez de abortar),
`--deactivate-missing` (desactiva productos ausentes del CSV) y `--delimiter=;`.
Detecta el separador automáticamente (`,` `;` tab o `|`).

Comportamiento:

- Agrupa por nombre: varias filas con el mismo nombre crean un producto con una
  variante por fila (columna `variante`; si falta, usa el SKU).
- **Actualiza** por `slug`, no duplica. Las variantes que desaparecen del CSV solo se
  borran si no tienen pedidos asociados.
- Valida precio, categoría, descripción (mínimo 10 caracteres), URLs de imagen y
  SKUs duplicados o ya usados por otro producto.
- Acepta precios en formato colombiano: `45.000`, `$45.000`, `19,50`, `1.234,56`.

Columnas reconocidas (con o sin tildes, en español o inglés):

| Campo | Obligatorio | Alias comunes |
| --- | --- | --- |
| `nombre` | Sí | `name`, `producto`, `titulo` |
| `categoria` | Sí | `category`, `familia` |
| `descripcion` | Sí | `description`, `detalle` |
| `precio` | Sí | `precio_venta`, `price`, `pvp`, `valor` |
| `descripcion_corta` | No | `resumen` |
| `precio_anterior` | No | `precio_tachado`, `old_price` (calcula el descuento) |
| `costo` | No | `precio_compra`, `supplier_price` (por defecto 0) |
| `costo_envio` | No | `envio_proveedor`, `supplier_shipping` (por defecto 0) |
| `proveedor` | No | `supplier`, `nombre_proveedor` (por defecto `Dropi`) |
| `stock` | No | `existencias`, `cantidad` (por defecto 0) |
| `sku` | No | `codigo`, `referencia` (se genera si falta) |
| `variante` | No | `talla`, `color`, `modelo` |
| `imagenes` | No | `imagen`, `foto`, `url_imagen` (separadas por `\|` o `;`) |
| `destacado` | No | `featured` |
| `activo` | No | `active`, `habilitado` |
| `id_proveedor` | No | `id_dropi`, `codigo_proveedor` |

Hay un ejemplo listo en `scripts/ejemplo-productos.csv`.

## Seguridad incluida

- **Todo `/admin` está protegido** por `proxy.ts`: sin cookie de sesión válida no se
  entra ni a la página ni a las acciones del panel, y `app/admin/login` redirige al
  panel si ya hay sesión.
- **Cada server action del panel** vuelve a validar la sesión con `assertAdmin()`;
  la cookie es `httpOnly` y firmada con HMAC-SHA256 (`ADMIN_SECRET`), y las
  credenciales se comparan en tiempo constante.
- La comparación de credenciales **falla de forma cerrada**: si en producción falta
  `ADMIN_USER`, `ADMIN_PASSWORD` o `ADMIN_SECRET`, el login queda bloqueado en vez de
  dejar pasar a cualquiera. Localmente se usan los valores por defecto, cámbialos.
- Limitador de peticiones (`lib/rate-limit.ts`) en login, carrito y creación de pedidos.
- Cookie de sesión de admin `httpOnly`, `sameSite=lax` y `secure` en producción.
- Cabeceras de seguridad (CSP, `X-Frame-Options`, HSTS…) en `next.config.ts`.

El limitador usa **Upstash Redis** cuando encuentra `UPSTASH_REDIS_REST_URL` y
`UPSTASH_REDIS_REST_TOKEN`, de modo que el tope se comparte entre todas las
instancias de Vercel (login 5/15 min, creación de pedidos 8/10 min, carrito y
subida de imágenes). Sin esas variables, o si Redis falla, cae al contador en
memoria: es más débil, pero la tienda sigue aceptando pedidos en vez de quedarse
muerta. Si prefieres no depender de Upstash, pon las variables y ya.

En producción, si faltan las dos variables, `instrumentation.ts` deja un aviso en
los logs del despliegue. **No detiene la tienda** (vender con menos protección es
mejor que no vender), pero avisa para que sepas que el tope real es varias veces
mayor al configurado.

## Despliegue en Vercel

### 1. Base de datos

La app usa **Prisma** y necesita dos variables de conexión:

- `DATABASE_URL`: la que usa la app en cada petición. En Supabase apunta al *pooler*
  en **modo transacción** para no agotar las conexiones del plan gratuito.
- `DIRECT_URL`: la que usan **las migraciones** y Prisma Studio. El pooler en modo
  transacción no sirve para DDL, así que esta apunta a la conexión directa o al pooler
  en modo sesión.

```
DATABASE_URL=postgresql://usuario:clave@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://usuario:clave@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Las dos URLs están en `prisma/schema.prisma` (`url` y `directUrl`). Aplica las
migraciones **una vez**, antes del primer deploy:

```bash
npm run db:deploy
```

### 2. Variables de entorno en el panel

En **Project Settings → Environment Variables**, para Production (y Preview):

| Variable | Obligatoria | Valor |
| --- | --- | --- |
| `DATABASE_URL` | sí | Pooler de Supabase, puerto 6543, modo transacción |
| `DIRECT_URL` | sí | Conexión directa o de sesión, para migraciones |
| `ADMIN_USER` | sí | Tu usuario, no `admin` |
| `ADMIN_PASSWORD` | sí | Una tuya, mínimo 8 caracteres |
| `ADMIN_SECRET` | sí | `npm run secret:admin`, mínimo 24 caracteres |
| `NEXT_PUBLIC_STORE_NAME` | sí | La marca. **Requiere redeploy** al cambiarla |
| `NEXT_PUBLIC_SITE_URL` | sí | `https://tu-dominio.com`, sin barra final |
| `SHIPPING_COST` | sí | Costo de envío en COP |
| `UPSTASH_REDIS_REST_URL` | recomendada | Del proyecto en upstash.com, para el rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | recomendada | Ídem |
| `STORE_WHATSAPP` | recomendada | Solo dígitos con prefijo de país, p. ej. `573001234567` |
| `STORE_EMAIL` | recomendada | Correo de atención |
| `STORE_PHONE` | opcional | Teléfono visible |
| `STORE_ADDRESS` | recomendada | Domicilio |
| `STORE_RESPONSIBLE` | recomendada | Titular del tratamiento de datos |
| `STORE_TAGLINE` | opcional | Eslogan del header |
| `SOCIAL_INSTAGRAM` / `FACEBOOK` / `TIKTOK` | opcional | Handles o URLs; vacío las oculta |

`NODE_ENV` no se configura: lo pone Next.js. `SEED_DEMO_ACTIVE` es solo para
desarrollo.

### 3. Primer deploy

```bash
npm run lint && npm run build
```

Luego conecta el repositorio en Vercel (o `npx vercel`) y despliega. Vercel corre
`npm install` (que dispara `prisma generate`) y `npm run build` automáticamente.

### 4. Antes de publicar

- [ ] `npm run db:deploy` aplicado con éxito.
- [ ] `ADMIN_PASSWORD` y `ADMIN_SECRET` propios (la app se niega a arrancar si no).
- [ ] `NEXT_PUBLIC_SITE_URL` con el dominio final, para sitemap y robots.
- [ ] Páginas legales completadas: los `[[COMPLETAR: ...]]` que quedan deben ser 0.
- [ ] Productos reales importados y los de ejemplo ocultos (`npm run demo:ocultar`).
- [ ] Imágenes: en Vercel el disco es de solo lectura, así que **subir imágenes desde
      el panel no funciona** hasta mover el almacenamiento a un bucket externo
      (Vercel Blob, S3 o Supabase Storage). Ver "Imágenes de producto".
- [ ] Si los productos traen fotos de otro dominio, agregarlo a
      `images.remotePatterns` en `next.config.ts` o saldrán rotas.
- [ ] El limitador de peticiones: si no vas a usar Upstash, recuerda que en Vercel
      cada instancia lleva su propio contador en memoria.
