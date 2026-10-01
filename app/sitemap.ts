import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { STORE_CONFIG } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = STORE_CONFIG.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/productos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/envios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/cambios-y-devoluciones`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/politica-de-privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terminos-y-condiciones`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });
    productRoutes = products.map((p) => ({
      url: `${base}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
