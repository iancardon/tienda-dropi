import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.com wss://*.supabase.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

// Hosts desde los que next/image puede descargar y optimizar.
//
// Los de ejemplo (Unsplash, Picsum) vienen de serie porque son los que usan los
// productos de prueba. Cuando se carguen fotos reales de Dropi o de cualquier
// otro proveedor, se añaden sus dominios en la variable IMAGE_HOSTS separada por
// comas, en VERCEL, y se vuelve a desplegar. No hace falta tocar este código.
const extraImageHosts = (process.env.IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter((host) => host.length > 0);

const imageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "picsum.photos" },
  ...extraImageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns,
  },
  // Las páginas legales se renombraron; estas rutas antigas siguen funcionando.
  async redirects() {
    return [
      { source: "/terminos", destination: "/terminos-y-condiciones", permanent: true },
      { source: "/devoluciones", destination: "/cambios-y-devoluciones", permanent: true },
      { source: "/politica-de-datos", destination: "/politica-de-privacidad", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
