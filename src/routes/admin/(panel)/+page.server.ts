import { redirect } from "@sveltejs/kit";
import { count, desc, eq, sum } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { roleHome } from "$lib/types/roles";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role === "staff_keuangan") {
    redirect(303, roleHome(locals.user.role));
  }

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
  const [santriRow] = await db
    .select({ value: count() })
    .from(table.santri)
    .where(eq(table.santri.status, "active"));

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
    role: locals.user?.role ?? "staff_pendaftaran",
    stats: {
      total: Number(totalRow?.value ?? 0),
      submitted: Number(submittedRow?.value ?? 0),
      pendingPayments: Number(pendingPaymentRow?.value ?? 0),
      accepted: Number(acceptedRow?.value ?? 0),
      santri: Number(santriRow?.value ?? 0),
      verifiedAmount: Number(verifiedRow?.value ?? 0)
    },
    recent
  };
};
