"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronDown } from "@/components/icons";

export type FaqItem = {
  question: string;
  answer: string;
  /** Si la respuesta termina en un enlace (políticas, contacto). */
  link?: { href: string; label: string };
};

/**
 * Preguntas frecuentes en acordeón.
 *
 * Se implementa con botones y estado de React en lugar de `<details>` para
 * poder controlar la animación y marcar `aria-expanded`. Solo un panel queda
 * abierto a la vez: en móvil la lista se lee mucho mejor así.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-zinc-50 sm:px-5"
              >
                <span className="text-[15px] font-semibold text-zinc-900">
                  {item.question}
                </span>
                <IconChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-emerald-600" : ""
                  }`}
                />
              </button>
            </h3>

            {isOpen && (
              <div className="animate-fade-rise px-4 pb-4 text-[15px] leading-relaxed text-zinc-600 sm:px-5">
                {item.answer}
                {item.link && (
                  <>
                    {" "}
                    <Link
                      href={item.link.href as never}
                      className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                    >
                      {item.link.label}
                    </Link>
                    .
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}