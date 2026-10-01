export const STORE_CONFIG = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? process.env.STORE_NAME ?? "MiTienda",
  tagline: process.env.STORE_TAGLINE ?? "Paga cuando recibes",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.STORE_WHATSAPP ?? "",
  email: process.env.STORE_EMAIL ?? "contacto@mitienda.com",
  phone: process.env.STORE_PHONE ?? "+57 300 000 0000",
  address: process.env.STORE_ADDRESS ?? "Colombia",
  responsible: process.env.STORE_RESPONSIBLE ?? "MiTienda (Titular por definir)",
  shippingCost: Number(process.env.SHIPPING_COST ?? "15000"),
  currency: "COP",
  locale: "es-CO",
  social: {
    instagram: process.env.SOCIAL_INSTAGRAM ?? "",
    facebook: process.env.SOCIAL_FACEBOOK ?? "",
    tiktok: process.env.SOCIAL_TIKTOK ?? "",
  },
} as const;

export type StoreConfig = typeof STORE_CONFIG;

export function getWhatsAppUrl(message: string): string {
  const phone = STORE_CONFIG.whatsapp.replace(/\D/g, "");
  if (!phone) return "#";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function formatPhone(): string {
  const digits = STORE_CONFIG.whatsapp.replace(/\D/g, "");
  const local = digits.slice(-10);
  if (local.length !== 10) return STORE_CONFIG.whatsapp;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

function normalizeSocial(base: string, value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.replace(/^@/, "")}`;
}

export function getSocialLinks(): { label: string; url: string }[] {
  return [
    {
      label: "Instagram",
      url: normalizeSocial("https://instagram.com/", STORE_CONFIG.social.instagram),
    },
    {
      label: "Facebook",
      url: normalizeSocial("https://facebook.com/", STORE_CONFIG.social.facebook),
    },
    {
      label: "TikTok",
      url: normalizeSocial("https://tiktok.com/@", STORE_CONFIG.social.tiktok),
    },
  ].filter((link) => link.url);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(STORE_CONFIG.locale, {
    style: "currency",
    currency: STORE_CONFIG.currency,
    minimumFractionDigits: 0,
  }).format(amount);
}