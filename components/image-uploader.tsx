"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  max?: number;
};

export function ImageUploader({ value, onChange, max = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urls = value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const sync = (next: string[]) => onChange(next.join("\n"));

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const current = [...urls];
    try {
      for (const file of Array.from(files)) {
        if (current.length >= max) {
          setError(`Máximo ${max} imágenes por producto.`);
          break;
        }
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "No se pudo subir la imagen.");
          break;
        }
        current.push(data.url);
        sync([...current]);
      }
    } catch {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) =>
    sync(urls.filter((_, i) => i !== index));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= urls.length) return;
    const next = [...urls];
    [next[index], next[target]] = [next[target], next[index]];
    sync(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="imageFiles"
          className={`cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-400 ${
            uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? "Subiendo..." : "Subir imágenes"}
        </label>
        <input
          ref={inputRef}
          id="imageFiles"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-xs text-zinc-400">
          JPG, PNG, WEBP o AVIF. Máximo 5 MB cada una. La primera es la
          principal.
        </span>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {urls.length > 0 && (
        <ul className="mt-3 space-y-2">
          {urls.map((url, index) => (
            <li
              key={url}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2"
            >
              {url.startsWith("/") ? (
                <Image
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-500">
                  URL
                </div>
              )}
              <span className="flex-1 truncate text-xs text-zinc-600">
                {index === 0 && (
                  <span className="mr-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    Principal
                  </span>
                )}
                {url}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Subir imagen"
                  className="rounded border border-zinc-300 px-2 py-1 text-xs transition hover:border-emerald-400 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === urls.length - 1}
                  aria-label="Bajar imagen"
                  className="rounded border border-zinc-300 px-2 py-1 text-xs transition hover:border-emerald-400 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label="Quitar imagen"
                  className="rounded border border-zinc-300 px-2 py-1 text-xs text-red-600 transition hover:border-red-400"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
