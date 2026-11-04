import { json } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const district = (url.searchParams.get("district") ?? "").trim();

  if (!/^\d{2}\.\d{2}\.\d{2}$/.test(district)) {
    return json({ message: "Kode kecamatan tidak valid." }, { status: 400 });
  }

  const rows = await db
    .select({ id: table.village.id, name: table.village.name })
    .from(table.village)
    .where(eq(table.village.districtId, district))
    .orderBy(asc(table.village.name));

  return json(rows, {
    headers: { "cache-control": "public, max-age=86400" }
  });
};
