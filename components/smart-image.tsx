"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SmartImageProps = Omit<ImageProps, "onError"> & {
  /** Texto alternativo del marco cuando la imagen no carga. */
  fallbackLabel?: string;
};

/**
 * Imagen que nunca se ve rota: si la URL falla (host no permitido, archivo
 * borrado, enlace del proveedor caído) muestra un marco neutro en su lugar.
 */
export function SmartImage({ fallbackLabel = "Sin imagen", alt, ...props }: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-400 ${props.className ?? ""}`}
        role="img"
        aria-label={`${alt} — ${fallbackLabel.toLowerCase()}`}
      >
        {fallbackLabel}
      </div>
    );
  }

  return <Image {...props} alt={alt} onError={() => setFailed(true)} />;
}
