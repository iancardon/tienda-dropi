import type { MetadataRoute } from "next";
import { STORE_CONFIG } from "@/lib/store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout", "/carrito", "/pedido/"],
      },
    ],
    sitemap: `${STORE_CONFIG.url}/sitemap.xml`,
    host: STORE_CONFIG.url,
  };
}
