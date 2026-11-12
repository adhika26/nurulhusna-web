import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

const STATUSES = [
  "submitted",
  "verified",
  "accepted",
  "rejected",
  "checked_in",
  "documents_complete",
  "enrolled",
  "needs_revision"
] as const;
type Status = (typeof STATUSES)[number];

export const load: PageServerLoad = async ({ url }) => {
  const statusParam = url.searchParams.get("status") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = STATUSES.includes(statusParam as Status) ? (statusParam as Status) : null;

  const conditions = [];

  if (status) conditions.push(eq(table.registration.status, status));
  if (q) {
    conditions.push(
      or(
        ilike(table.registration.fullName, `%${q}%`),
        ilike(table.registration.code, `%${q}%`)
      )
    );
  }

  const rows = await db
    .select({
      id: table.registration.id,
      code: table.registration.code,
      fullName: table.registration.fullName,
      status: table.registration.status,
      source: table.registration.source,
      createdAt: table.registration.createdAt,
      phone: table.registration.phone,
      categoryName: table.santriCategory.name,
      invoiceStatus: table.invoice.status,
      invoiceTotal: table.invoice.totalAmount
    })
    .from(table.registration)
    .innerJoin(table.santriCategory, eq(table.registration.categoryId, table.santriCategory.id))
    .leftJoin(table.invoice, eq(table.invoice.registrationId, table.registration.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(table.registration.createdAt))
    .limit(100);

  const countRows = await db
    .select({ status: table.registration.status, total: count() })
    .from(table.registration)
    .groupBy(table.registration.status);

  const counts: Record<string, number> = {};
  for (const row of countRows) counts[row.status] = Number(row.total);

  return { rows, status, q, counts };
};
