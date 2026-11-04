import { error } from "@sveltejs/kit";
import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { resolveUpload } from "$lib/server/ppdb/storage";
import type { RequestHandler } from "./$types";

const types: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf"
};

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, "Tidak diizinkan.");

  const [document] = await db
    .select()
    .from(table.registrationDocument)
    .where(eq(table.registrationDocument.id, params.id));

  if (!document) error(404, "Berkas tidak ditemukan.");

  let file: Buffer;

  try {
    file = await readFile(resolveUpload(document.filePath));
  } catch {
    error(404, "File berkas tidak ditemukan.");
  }

  const extension = document.filePath.split(".").pop()?.toLowerCase() ?? "";

  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": types[extension] ?? "application/octet-stream",
      "content-disposition": "inline",
      "cache-control": "private, no-store"
    }
  });
};
