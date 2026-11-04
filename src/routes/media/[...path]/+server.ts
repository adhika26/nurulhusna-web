import { error } from "@sveltejs/kit";
import { readFile } from "node:fs/promises";
import { resolveUpload } from "$lib/server/ppdb/storage";
import type { RequestHandler } from "./$types";

const types: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

export const GET: RequestHandler = async ({ params }) => {
  const path = params.path ?? "";

  // Hanya folder public dengan nama file acak yang boleh diakses.
  if (!/^public\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/.test(path)) {
    error(404, "Berkas tidak ditemukan.");
  }

  let file: Buffer;

  try {
    file = await readFile(resolveUpload(path));
  } catch {
    error(404, "Berkas tidak ditemukan.");
  }

  const extension = path.split(".").pop()?.toLowerCase() ?? "";

  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": types[extension] ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
};
