import { redirect } from "@sveltejs/kit";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.ppdbAccount) {
    redirect(303, "/ppdb/akun/masuk?next=/ppdb/akun");
  }

  const rows = await db
    .select({
      registration: table.registration,
      category: { name: table.santriCategory.name },
      wave: { academicYear: table.registrationWave.academicYear },
      invoice: {
        id: table.invoice.id,
        totalAmount: table.invoice.totalAmount,
        status: table.invoice.status,
        scheme: table.invoice.scheme
      }
    })
    .from(table.registration)
    .innerJoin(table.santriCategory, eq(table.registration.categoryId, table.santriCategory.id))
    .innerJoin(table.registrationWave, eq(table.registration.waveId, table.registrationWave.id))
    .leftJoin(table.invoice, eq(table.invoice.registrationId, table.registration.id))
    .where(eq(table.registration.accountId, locals.ppdbAccount.id))
    .orderBy(desc(table.registration.createdAt));

  const invoiceIds = rows
    .map((row) => row.invoice?.id)
    .filter((id): id is string => typeof id === "string");

  const verifiedPayments =
    invoiceIds.length > 0
      ? await db
          .select({ invoiceId: table.payment.invoiceId, amount: table.payment.amount })
          .from(table.payment)
          .where(
            and(
              eq(table.payment.status, "verified"),
              inArray(table.payment.invoiceId, invoiceIds)
            )
          )
      : [];

  const paidByInvoice = new Map<string, number>();
  for (const payment of verifiedPayments) {
    paidByInvoice.set(
      payment.invoiceId,
      (paidByInvoice.get(payment.invoiceId) ?? 0) + Number(payment.amount)
    );
  }

  return {
    account: locals.ppdbAccount,
    registrations: rows.map((row) => {
      const total = row.invoice ? Number(row.invoice.totalAmount) : 0;
      const paid = row.invoice ? (paidByInvoice.get(row.invoice.id) ?? 0) : 0;

      return {
        id: row.registration.id,
        code: row.registration.code,
        fullName: row.registration.fullName,
        status: row.registration.status,
        rejectionReason: row.registration.rejectionReason,
        revisionNote: row.registration.revisionNote,
        categoryName: row.category.name,
        academicYear: row.wave.academicYear,
        createdAt: row.registration.createdAt,
        invoiceStatus: row.invoice?.status ?? null,
        total,
        paid,
        remaining: Math.max(total - paid, 0)
      };
    })
  };
};
