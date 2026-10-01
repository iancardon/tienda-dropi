"use client";

import { SmartImage } from "@/components/smart-image";
import { useState } from "react";

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

  const current = images[Math.min(index, images.length - 1)];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        <SmartImage
          src={current}
          alt={name}
          width={800}
          height={800}
          priority
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1} de ${name}`}
              className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition ${
                i === index
                  ? "border-emerald-600"
                  : "border-transparent hover:border-zinc-300"
              }`}
            >
              <SmartImage
                src={img}
                alt={`${name} ${i + 1}`}
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