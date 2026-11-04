import { json } from "@sveltejs/kit";
import { asc } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const rows = await db
    .select({ id: table.province.id, name: table.province.name })
    .from(table.province)
    .orderBy(asc(table.province.name));

  return json(rows, {
    headers: { "cache-control": "public, max-age=86400" }
  });
};
