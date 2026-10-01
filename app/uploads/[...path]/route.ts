import { readFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import {
  UPLOADS_PRODUCTS_DIR,
  contentTypeFor,
  uploadsProductsPath,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILENAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/i;

function notFound(): Response {
  return new Response("No encontrado", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await ctx.params;

  if (segments.length !== 2 || segments[0] !== UPLOADS_PRODUCTS_DIR) {
    return notFound();
  }

  const filename = segments[1];
  if (!FILENAME_RE.test(filename)) return notFound();

  const contentType = contentTypeFor(filename);
  if (!contentType) return notFound();

  try {
    const file = await readFile(path.join(uploadsProductsPath(), filename));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return notFound();
  }
}
