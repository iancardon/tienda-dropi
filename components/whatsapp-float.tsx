"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import { STORE_CONFIG, getWhatsAppUrl } from "@/lib/store";

/**
 * Botón flotante de WhatsApp.
 *
 * Solo aparece después de que la persona empieza a hacer scroll, para no tapar
 * el contenido ni competir con el carrito en la parte superior. En móvil se
 * mantiene dentro del ancho de la pantalla y por encima de la barra de
 * WhatsApp del sistema para que no quede nada inaccesible.
 */
export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Se oculta en checkout y confirmación: ahí el usuario ya está escribiendo
  // sus datos y un botón flotante estorba.
  const hiddenOnRoute =
    pathname.startsWith("/checkout") || pathname.startsWith("/pedido/");

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!STORE_CONFIG.whatsapp || hiddenOnRoute) return null;

  const href = getWhatsAppUrl(
    `Hola, tengo una consulta sobre ${STORE_CONFIG.name}.`
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className={`fixed right-4 bottom-4 z-30 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl sm:right-6 sm:bottom-6 sm:h-14 sm:w-14 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <IconWhatsApp className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  );
}