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

  const [payment] = await db
    .select()
    .from(table.payment)
    .where(eq(table.payment.id, params.id));

  if (!payment?.proofPath) error(404, "Bukti pembayaran tidak ditemukan.");

  let file: Buffer;

  try {
    file = await readFile(resolveUpload(payment.proofPath));
  } catch {
    error(404, "File bukti pembayaran tidak ditemukan.");
  }

  const extension = payment.proofPath.split(".").pop()?.toLowerCase() ?? "";

  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": types[extension] ?? "application/octet-stream",
      "content-disposition": "inline",
      "cache-control": "private, no-store"
    }
  });
};
