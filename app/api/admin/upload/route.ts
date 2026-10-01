import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  UPLOADS_PRODUCTS_DIR,
  UPLOADS_URL_PREFIX,
  uploadsProductsPath,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, { ext: string; magic: number[][] }> = {
  "image/jpeg": { ext: "jpg", magic: [[0xff, 0xd8, 0xff]] },
  "image/png": { ext: "png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  "image/webp": {
    ext: "webp",
    magic: [
      [0x52, 0x49, 0x46, 0x46],
      [0x57, 0x45, 0x42, 0x50],
    ],
  },
  "image/avif": {
    ext: "avif",
    magic: [
      [0x66, 0x74, 0x79, 0x70],
      [0x61, 0x76, 0x69, 0x66],
    ],
  },
};

function hasValidMagic(bytes: Uint8Array, magic: number[][]): boolean {
  return magic.some((signature) =>
    signature.every((byte, i) => bytes[i] === byte)
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const limit = await rateLimit(`upload:${getClientIp(request.headers)}`, 60, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el archivo" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el máximo de 5 MB" },
      { status: 413 }
    );
  }

  const type = ALLOWED[file.type];
  if (!type) {
    return NextResponse.json(
      { error: "Formato no permitido. Usa JPG, PNG, WEBP o AVIF." },
      { status: 415 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidMagic(bytes, type.magic)) {
    return NextResponse.json(
      { error: "El archivo no es una imagen válida" },
      { status: 415 }
    );
  }

  const filename = `${randomUUID()}.${type.ext}`;
  const targetDir = uploadsProductsPath();
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), bytes);

  return NextResponse.json({
    url: `${UPLOADS_URL_PREFIX}/${UPLOADS_PRODUCTS_DIR}/${filename}`,
  });
}
