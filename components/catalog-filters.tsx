"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IconClose, IconSearch } from "@/components/icons";

type SortOption = "destacados" | "nuevos" | "precio-asc" | "precio-desc";

const SORT_LABELS: Record<SortOption, string> = {
  destacados: "Destacados primero",
  nuevos: "Más nuevos",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
};

/**
 * Buscador, filtros y orden del catálogo.
 *
 * Todo el estado vive en la URL. Así el resultado se puede compartir por
 * WhatsApp, se puede marcar como favorito y el botón "atrás" del teléfono
 * funciona como espera la gente. El componente no filtra nada por su cuenta:
 * solo reconstruye la dirección y deja que el servidor haga la consulta.
 */
export function CatalogFilters({
  categories,
  total,
}: {
  categories: string[];
  /** `undefined` mientras el servidor aún no sabe cuántos hay. */
  total?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCategory = searchParams.get("categoria") ?? "";
  const onlyOffers = searchParams.get("ofertas") === "1";
  const sort = (searchParams.get("orden") as SortOption | null) ?? "destacados";

  // Espera a que el usuario deje de escribir antes de consultar. Sin este
  // retardo cada tecla dispararía una consulta a la base de datos.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (term.trim() === current) return;

    const timer = setTimeout(() => {
      updateParams({ q: term.trim() || null });
    }, 350);

    return () => clearTimeout(timer);
    // Solo depende del texto: `searchParams` cambia con cada navegación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function updateParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    // Al cambiar de categoría o de orden se vuelve a la primera página de
    // resultados; si no, se podría caer en una página vacía.
    params.delete("pagina");

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/productos?${query}` : "/productos", { scroll: false });
    });
  }

  const activeFilters =
    (activeCategory ? 1 : 0) + (onlyOffers ? 1 : 0) + (searchParams.get("q") ? 1 : 0);

  const inputClass =
    "w-full rounded-xl border border-zinc-300 bg-white py-2.5 pr-10 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Búsqueda y orden: visibles siempre, también en móvil. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar productos por nombre…"
            aria-label="Buscar productos"
            className={inputClass}
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Limpiar búsqueda"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <IconClose className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                activeCategory || onlyOffers
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400"
              }`}
            >
              Filtros
              {activeFilters > 0 && (
                <span className="ml-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          )}

          <label className="sr-only" htmlFor="orden-catalogo">
            Ordenar productos
          </label>
          <select
            id="orden-catalogo"
            value={sort}
            onChange={(event) => updateParams({ orden: event.target.value })}
            className="shrink-0 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* El panel de filtros se despliega en línea en escritorio y debajo del
          buscador en móvil, para no comer altura antes de ver los productos. */}
      {filtersOpen && categories.length > 0 && (
        <div className="animate-fade-rise rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">Filtrar por</p>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateParams({ categoria: null, ofertas: null, q: null })
                }
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Quitar filtros
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <CategoryChip
              active={!activeCategory}
              label="Todas"
              onClick={() => updateParams({ categoria: null })}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category}
                active={activeCategory === category}
                label={category}
                onClick={() => updateParams({ categoria: category })}
              />
            ))}
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 border-t border-zinc-100 pt-4">
            <input
              type="checkbox"
              checked={onlyOffers}
              onChange={(event) =>
                updateParams({
                  ofertas: event.target.checked ? "1" : null,
                })
              }
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-zinc-700">
              Ver solo productos en oferta
            </span>
          </label>
        </div>
      )}

      {/* Resumen de resultados. Se oculta mientras se recarga para no
          parpadear con el número anterior. */}
      <div className="flex items-center justify-between gap-3 text-sm text-zinc-500">
        <p aria-live="polite" className={isPending ? "opacity-50" : undefined}>
          {total === undefined ? (
            "Cargando productos…"
          ) : total === 0 ? (
            "Sin resultados"
          ) : (
            <>
              <span className="font-semibold text-zinc-900">{total}</span>{" "}
              {total === 1 ? "producto" : "productos"}
              {activeCategory && (
                <>
                  {" "}
                  en <span className="font-medium">{activeCategory}</span>
                </>
              )}
            </>
          )}
        </p>

        {activeFilters > 0 && (
          <button
            type="button"
            onClick={() => updateParams({ categoria: null, ofertas: null, q: null })}
            className="shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-800 sm:hidden"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400 hover:text-emerald-700"
      }`}
    >
      {label}
    </button>
  );
}