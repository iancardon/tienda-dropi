import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalValue } from "@/components/legal-shell";
import { legalField } from "@/lib/legal";
import { STORE_CONFIG } from "@/lib/store";

export const metadata: Metadata = {
  title: "Cambios y Devoluciones",
  description: `Política de cambios, devoluciones y garantías de ${STORE_CONFIG.name}.`,
};

export default function CambiosYDevolucionesPage() {
  return (
    <LegalShell
      title="Cambios y Devoluciones"
      intro="Cómo solicitar un cambio, una devolución o una garantía, y qué costos asumes en cada caso."
    >
      <section>
        <h2 className="text-xl font-semibold">1. Derecho de retracto</h2>
        <p>
          Como consumidor tiene derecho a retractarse de la compra dentro de los 5 días
          hábiles siguientes a la entrega, sin necesidad de justa causa. El producto
          debe estar sin uso, con sus empaques y accesorios originales.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Garantía legal</h2>
        <p>
          Los productos tienen garantía legal por defectos de fábrica conforme al
          Estatuto del Consumidor (Ley 1480 de 2011). Los plazos son:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Productos durables: 1 año.</li>
          <li>Productos no durables (bienes de consumo): 3 meses.</li>
        </ul>
        <p className="mt-2">
          La garantía cubre defectos de fabricación, materiales o funcionamiento. No
          cubre el mal uso, los golpes, la humedad, las modificaciones ni el desgaste
          normal.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Cambio por talla, color o referencia</h2>
        <p>Puede solicitar un cambio dentro de los 5 días hábiles después de la entrega.</p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>El producto debe estar sin uso, con etiquetas y empaque original.</li>
          <li>Debe presentar el comprobante del pedido.</li>
          <li>Debe existir disponibilidad de la referencia deseada.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Producto defectuoso o equivocado</h2>
        <p>
          Si recibe un producto con defecto de fábrica o distinto al pedido, asumimos
          todos los costos de envío de ida y vuelta. Repórtelo dentro de las 48 horas
          siguientes a la entrega enviando fotos por WhatsApp.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Cómo iniciar el proceso</h2>
        <ol className="mt-2 list-decimal list-inside space-y-2">
          <li>
            Escríbanos por WhatsApp o correo a{" "}
            <Link href="/contacto" className="underline hover:text-emerald-600">
              nuestra página de contacto
            </Link>
            .
          </li>
          <li>Indique el número de pedido y el motivo de la solicitud.</li>
          <li>Si hay un defecto, adjunte fotos del producto.</li>
          <li>Le enviaremos las instrucciones de envío de vuelta.</li>
          <li>Al revisar el producto, procesamos el cambio o el reembolso.</li>
        </ol>
        <p className="mt-2">
          Horario de atención de soporte:{" "}
          <span className="font-mono text-[0.9em] text-amber-800">
            [[COMPLETAR: horario de atención de soporte posventa]]
          </span>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Reembolsos</h2>
        <p>
          El reembolso se realiza por el mismo medio en que pagó, es decir, en efectivo
          contra entrega, o por transferencia si así se acuerda. El plazo es de 5 a 10
          días hábiles después de recibir y aprobar la devolución. El valor
          reembolsado corresponde al producto y no incluye el envío, salvo que el
          problema sea responsabilidad de la tienda.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Excepciones</h2>
        <p>No aplica retracto, cambio ni devolución en:</p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Productos de uso personal o productos personalizados.</li>
          <li>Productos perecederos o con fecha de vencimiento corta.</li>
          <li>Licencias digitales o contenido descargable.</li>
          <li>Productos dañados por mal uso, golpes o humedad.</li>
          <li>Productos sin etiquetas, sin empaque original o con señales de uso.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Costos de envío en las devoluciones</h2>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Error de la tienda (producto equivocado o defectuoso): envío gratis.</li>
          <li>Cambio por talla, color o gusto: paga el cliente el envío de ida y vuelta.</li>
          <li>Retracto por derecho legal: paga el cliente el envío de retorno.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Contacto</h2>
        <p>
          Para iniciar un cambio o devolución escríbanos a{" "}
          <LegalValue field={legalField("email")} /> o escríbanos por WhatsApp al{" "}
          <LegalValue field={legalField("whatsapp")} />.
        </p>
      </section>
    </LegalShell>
  );
}
