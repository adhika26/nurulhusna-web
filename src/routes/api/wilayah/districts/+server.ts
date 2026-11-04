import { json } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const regency = (url.searchParams.get("regency") ?? "").trim();

  if (!/^\d{2}\.\d{2}$/.test(regency)) {
    return json({ message: "Kode kabupaten/kota tidak valid." }, { status: 400 });
  }

  const rows = await db
    .select({ id: table.district.id, name: table.district.name })
    .from(table.district)
    .where(eq(table.district.regencyId, regency))
    .orderBy(asc(table.district.name));

  return json(rows, {
    headers: { "cache-control": "public, max-age=86400" }
  });
};
