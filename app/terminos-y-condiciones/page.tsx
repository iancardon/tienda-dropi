import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalValue } from "@/components/legal-shell";
import { legalField } from "@/lib/legal";
import { STORE_CONFIG } from "@/lib/store";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: `Términos y condiciones de compra en ${STORE_CONFIG.name}, tienda con pago contra entrega en Colombia.`,
};

export default function TerminosYCondicionesPage() {
  return (
    <LegalShell
      title="Términos y Condiciones"
      intro="Condiciones que rigen el uso de este sitio y las compras con pago contra entrega."
    >
      <section>
        <h2 className="text-xl font-semibold">1. Aceptación</h2>
        <p>
          Al usar este sitio o confirmar un pedido, usted acepta estas condiciones, la{" "}
          <Link
            href="/politica-de-privacidad"
            className="underline hover:text-emerald-600"
          >
            Política de Privacidad
          </Link>{" "}
          y la{" "}
          <Link
            href="/cambios-y-devoluciones"
            className="underline hover:text-emerald-600"
          >
            Política de Cambios y Devoluciones
          </Link>
          . Si no está de acuerdo con alguna de ellas, le pedimos no realizar pedidos.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Quién puede comprar</h2>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Mayores de 18 años.</li>
          <li>Que los datos de contacto y de entrega sean correctos y verificables.</li>
          <li>Que actúen de buena fe y sin hacer un uso fraudulento del sitio.</li>
        </ul>
        <p className="mt-2">
          No es necesario crear una cuenta: el pedido se identifica con el número de
          teléfono y los datos de entrega que usted entrega.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Productos y disponibilidad</h2>
        <p>
          Las fotografías, descripciones, pesos, medidas y demás características de los
          productos son orientativas y pueden variar ligeramente respecto del artículo
          recibido. El stock que aparece en el sitio refleja la disponibilidad conocida
          del proveedor y puede cambiar sin previo aviso. Si un producto se agota o su
          precio cambia antes de la confirmación, nos comunicamos con usted y puede
          cancelar sin costo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Precios y costos</h2>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>
            Los precios se expresan en pesos colombianos (COP) e incluyen los impuestos
            aplicables, salvo que se indique lo contrario.
          </li>
          <li>
            El costo de envío se informa antes de confirmar el pedido y forma parte
            del total a pagar.
          </li>
          <li>
            No cobramos ningún valor por adelantado ni pedimos datos de tarjeta de
            crédito para reservar un pedido.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Pago contra entrega</h2>
        <p>
          El pago se realiza en efectivo, al momento de la entrega, directamente al
          transportador. El valor a cobrar es el total del pedido, incluido el envío. La
          tienda no responde por pagos hechos a personas distintas del transportador
          oficial, ni por entregas a terceros no autorizados.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Pedidos y confirmación</h2>
        <p>
          Al confirmar un pedido, usted autoriza el tratamiento de sus datos para
          contactarlo y validar las condiciones de la entrega. Podemos cancelar un
          pedido si detectamos datos inconsistentes, intentos de fraude o si no es
          posible entregar en la dirección indicada. En ese caso no se cobra nada.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Envíos</h2>
        <p>
          Los tiempos de entrega son estimados y dependen de la transportadora y de la
          cobertura del proveedor. Puede revisar el detalle en nuestra{" "}
          <Link href="/envios" className="underline hover:text-emerald-600">
            política de envíos
          </Link>
          . El costo indicado en el sitio corresponde al envío hacia la mayoría de las
          ciudades. Zonas especiales, municipios lejanos o áreas no transportables se
          confirman por WhatsApp antes del despacho. No aseguramos días ni horas
          exactas de entrega.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Proveedor y despacho</h2>
        <p>
          <LegalValue field={legalField("storeName")} /> actúa como comercializador y
          comercializa productos que son preparados y despachados por proveedores
          aliados. El responsable del tratamiento de sus datos es{" "}
          <LegalValue field={legalField("responsible")} />. Si un producto no puede ser
          despachado por el proveedor, se lo informamos y puede elegir otro producto o
          cancelar.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Garantías</h2>
        <p>
          Los productos tienen garantía legal por defectos de fábrica conforme al
          Estatuto del Consumidor (Ley 1480 de 2011). Cuando el producto no sea de
          consumo durable, el plazo es de 3 meses; para productos durables, de 1 año,
          salvo que el fabricante ofrezca un plazo mayor. El procedimiento está en la{" "}
          <Link
            href="/cambios-y-devoluciones"
            className="underline hover:text-emerald-600"
          >
            Política de Cambios y Devoluciones
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Responsabilidad</h2>
        <p>
          <LegalValue field={legalField("storeName")} /> no se hace responsable de
          daños causados por una dirección de entrega incorrecta, por hechos de
          terceros, por retenciones de las transportadoras ni por fenómenos de caso
          fortuito o fuerza mayor. Tampoco responde por el uso indebido que el
          comprador haga del producto. Nuestra responsabilidad se limita al valor
          del pedido.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">11. Protección de datos</h2>
        <p>
          El tratamiento de sus datos personales se rige por la{" "}
          <Link
            href="/politica-de-privacidad"
            className="underline hover:text-emerald-600"
          >
            Política de Privacidad
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">12. Ley aplicable y jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de la República de Colombia. Cualquier
          controversia se somete a los jueces y tribunales de{" "}
          <span className="font-mono text-[0.9em] text-amber-800">
            [[COMPLETAR: ciudad y juzgado competente]]
          </span>
          , sin perjuicio de que el consumidor pueda acudir a la Superintendencia de
          Industria y Comercio.
        </p>
      </section>
    </LegalShell>
  );
}
