import { json } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const province = (url.searchParams.get("province") ?? "").trim();

  if (!/^\d{2}$/.test(province)) {
    return json({ message: "Kode provinsi tidak valid." }, { status: 400 });
  }

  const rows = await db
    .select({ id: table.regency.id, name: table.regency.name })
    .from(table.regency)
    .where(eq(table.regency.provinceId, province))
    .orderBy(asc(table.regency.name));

  return json(rows, {
    headers: { "cache-control": "public, max-age=86400" }
  });
};
