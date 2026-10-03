"use client";

import { SmartImage } from "@/components/smart-image";
import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-400">
        Sin imagen
      </div>
    );
  }

  // `min` evita que un índice guardado de más rompa la galería si la lista de
  // imágenes cambia entre renderizados.
  const safeIndex = Math.min(index, images.length - 1);
  const current = images[safeIndex];

  const go = (delta: number) => {
    setIndex((prev) => (prev + delta + images.length) % images.length);
  };

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        <SmartImage
          key={current}
          src={current}
          alt={`${name} — imagen ${safeIndex + 1} de ${images.length}`}
          width={800}
          height={800}
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="h-full w-full object-cover"
        />

        {/* Flechas solo cuando hay algo que ver entre imágenes. Se ocultan en
            móvil porque las miniaturas ya cumplen esa función. */}
        {images.length > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} name={name} />
            <GalleryArrow side="right" onClick={() => go(1)} name={name} />

            <span className="absolute bottom-3 right-3 rounded-full bg-zinc-900/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {safeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="no-scrollbar mt-3 flex gap-2 overflow-x-auto"
          role="tablist"
          aria-label={`Imágenes de ${name}`}
        >
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1} de ${name}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${
                i === safeIndex
                  ? "border-emerald-600"
                  : "border-transparent hover:border-zinc-300"
              }`}
            >
              <SmartImage
                src={img}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
  name,
}: {
  side: "left" | "right";
  onClick: () => void;
  name: string;
}) {
  const Icon = side === "left" ? IconChevronLeft : IconChevronRight;
  const position = side === "left" ? "left-3" : "right-3";
  const label =
    side === "left" ? "Imagen anterior" : "Imagen siguiente";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} de ${name}`}
      className={`absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm transition hover:bg-white sm:flex ${position}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}