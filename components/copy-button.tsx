"use client";

import { useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  title?: string;
};

/** Copia texto al portapapeles con confirmación visible. */
export function CopyButton({
  text,
  label = "Copiar",
  copiedLabel = "¡Copiado!",
  className = "",
  title,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback para navegadores sin permiso de portapapeles.
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={title}
      className={`rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700 ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
