import { count, desc, eq, sum } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const [totalRow] = await db.select({ value: count() }).from(table.registration);
  const [submittedRow] = await db
    .select({ value: count() })
    .from(table.registration)
    .where(eq(table.registration.status, "submitted"));
  const [pendingPaymentRow] = await db
    .select({ value: count() })
    .from(table.payment)
    .where(eq(table.payment.status, "pending"));
  const [verifiedRow] = await db
    .select({ value: sum(table.payment.amount) })
    .from(table.payment)
    .where(eq(table.payment.status, "verified"));
  const [acceptedRow] = await db
    .select({ value: count() })
    .from(table.registration)
    .where(eq(table.registration.status, "accepted"));

  const recent = await db
    .select({
      id: table.registration.id,
      code: table.registration.code,
      fullName: table.registration.fullName,
      status: table.registration.status,
      createdAt: table.registration.createdAt
    })
    .from(table.registration)
    .orderBy(desc(table.registration.createdAt))
    .limit(5);

  return {
    stats: {
      total: Number(totalRow?.value ?? 0),
      submitted: Number(submittedRow?.value ?? 0),
      pendingPayments: Number(pendingPaymentRow?.value ?? 0),
      accepted: Number(acceptedRow?.value ?? 0),
      verifiedAmount: Number(verifiedRow?.value ?? 0)
    },
    recent
  };
};
