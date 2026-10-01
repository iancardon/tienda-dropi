import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}