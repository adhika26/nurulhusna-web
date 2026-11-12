import { and, count, desc, eq, gte, isNotNull, ne, sum } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { canManagePayment } from "$lib/server/roles";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pendingRow] = await db
    .select({ value: count() })
    .from(table.payment)
    .where(eq(table.payment.status, "pending"));
  const [unpaidRow] = await db
    .select({ value: count() })
    .from(table.invoice)
    .where(eq(table.invoice.status, "unpaid"));
  const [partialRow] = await db
    .select({ value: count() })
    .from(table.invoice)
    .where(eq(table.invoice.status, "partial"));
  const [todayRow] = await db
    .select({ value: sum(table.payment.amount) })
    .from(table.payment)
    .where(and(eq(table.payment.status, "verified"), gte(table.payment.verifiedAt, startOfDay)));
  const [totalRow] = await db
    .select({ value: sum(table.payment.amount) })
    .from(table.payment)
    .where(eq(table.payment.status, "verified"));

  const pending = await db
    .select({
      payment: table.payment,
      invoice: { id: table.invoice.id, totalAmount: table.invoice.totalAmount },
      registration: {
        id: table.registration.id,
        code: table.registration.code,
        fullName: table.registration.fullName
      },
      installment: { sequence: table.installment.sequence }
    })
    .from(table.payment)
    .innerJoin(table.invoice, eq(table.payment.invoiceId, table.invoice.id))
    .innerJoin(table.registration, eq(table.invoice.registrationId, table.registration.id))
    .leftJoin(table.installment, eq(table.payment.installmentId, table.installment.id))
    .where(
      and(
        eq(table.payment.status, "pending"),
        ne(table.registration.status, "rejected"),
        ne(table.registration.status, "needs_revision")
      )
    )
    .orderBy(desc(table.payment.createdAt))
    .limit(10);

  const waitingPayment = await db
    .select({
      registration: {
        id: table.registration.id,
        code: table.registration.code,
        fullName: table.registration.fullName
      },
      category: { name: table.santriCategory.name },
      invoice: { id: table.invoice.id, totalAmount: table.invoice.totalAmount, status: table.invoice.status }
    })
    .from(table.registration)
    .innerJoin(table.invoice, eq(table.invoice.registrationId, table.registration.id))
    .innerJoin(table.santriCategory, eq(table.registration.categoryId, table.santriCategory.id))
    .where(
      and(
        isNotNull(table.registration.documentsVerifiedAt),
        ne(table.invoice.status, "paid"),
        ne(table.registration.status, "rejected"),
        ne(table.registration.status, "needs_revision")
      )
    )
    .orderBy(desc(table.registration.updatedAt))
    .limit(10);

  return {
    stats: {
      pending: Number(pendingRow?.value ?? 0),
      unpaid: Number(unpaidRow?.value ?? 0),
      partial: Number(partialRow?.value ?? 0),
      verifiedToday: Number(todayRow?.value ?? 0),
      verifiedTotal: Number(totalRow?.value ?? 0)
    },
    pending,
    waitingPayment,
    permissions: { payment: canManagePayment(locals.user?.role) }
  };
};
