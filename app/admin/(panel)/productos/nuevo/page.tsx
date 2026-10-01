import type { Metadata } from "next";
import Link from "next/link";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default function NuevoProductoPage() {
  return (
    <div>
      <Link
        href="/admin/productos"
        className="text-sm font-medium text-zinc-500 transition hover:text-emerald-600"
      >
        ← Volver a productos
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Nuevo producto</h1>
      <ProductForm action={createProduct} submitLabel="Crear producto" />
    </div>
  );
}