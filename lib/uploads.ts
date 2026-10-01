import path from "path";

export const UPLOADS_URL_PREFIX = "/uploads";

export const UPLOADS_PRODUCTS_DIR = "productos";

export function uploadsRoot(): string {
  const configured = process.env.UPLOADS_DIR;
  if (configured && configured.trim() !== "") {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "uploads");
}

export function uploadsProductsPath(): string {
  return path.join(uploadsRoot(), UPLOADS_PRODUCTS_DIR);
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export function contentTypeFor(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? null;
}
