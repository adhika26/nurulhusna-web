import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024;

export type AllowedKind = "image" | "document";

function detect(bytes: Uint8Array): { ext: string; kind: AllowedKind } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", kind: "image" };
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { ext: "png", kind: "image" };
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return { ext: "pdf", kind: "document" };
  }
  return null;
}

export function uploadRoot(): string {
  return process.env.UPLOAD_DIR ?? "./data/uploads";
}

/**
 * Menyimpan file upload dengan nama acak. Validasi dilakukan dari isi file
 * (magic bytes), bukan ekstensi. Mengembalikan path relatif terhadap UPLOAD_DIR.
 */
export async function saveUpload(
  file: File,
  folder: string,
  allowed: AllowedKind[] = ["image"]
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Ukuran file maksimal 5 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detect(bytes);

  if (!detected || !allowed.includes(detected.kind)) {
    throw new Error("Format file tidak didukung.");
  }

  const filename = `${randomUUID()}.${detected.ext}`;
  const directory = join(uploadRoot(), folder);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), bytes);

  return `${folder}/${filename}`;
}

export function resolveUpload(relativePath: string): string {
  return join(uploadRoot(), relativePath);
}
