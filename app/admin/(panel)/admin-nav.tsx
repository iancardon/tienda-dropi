"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="font-bold tracking-tight">
            Admin
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            {links.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "text-emerald-600"
                      : "text-zinc-600 transition hover:text-emerald-600"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-zinc-500 transition hover:text-emerald-600"
          >
            Ver tienda
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="font-medium text-zinc-500 transition hover:text-red-600"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}