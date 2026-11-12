import { fail } from "@sveltejs/kit";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { rejectPayment, verifyPayment } from "$lib/server/ppdb/payment.service";
import { logAudit } from "$lib/server/services/audit.service";
import { canManagePayment } from "$lib/server/roles";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
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
    .orderBy(desc(table.payment.createdAt));

  const history = await db
    .select({
      payment: table.payment,
      registration: {
        id: table.registration.id,
        code: table.registration.code,
        fullName: table.registration.fullName
      }
    })
    .from(table.payment)
    .innerJoin(table.invoice, eq(table.payment.invoiceId, table.invoice.id))
    .innerJoin(table.registration, eq(table.invoice.registrationId, table.registration.id))
    .where(ne(table.payment.status, "pending"))
    .orderBy(desc(table.payment.verifiedAt))
    .limit(30);

  const invoiceRows = await db
    .select({
      invoice: table.invoice,
      registration: {
        id: table.registration.id,
        code: table.registration.code,
        fullName: table.registration.fullName
      },
      category: { name: table.santriCategory.name }
    })
    .from(table.invoice)
    .innerJoin(table.registration, eq(table.invoice.registrationId, table.registration.id))
    .innerJoin(table.santriCategory, eq(table.registration.categoryId, table.santriCategory.id))
    .where(ne(table.invoice.status, "cancelled"))
    .orderBy(desc(table.invoice.createdAt))
    .limit(40);

  const verifiedPayments = await db
    .select({ invoiceId: table.payment.invoiceId, amount: table.payment.amount })
    .from(table.payment)
    .where(eq(table.payment.status, "verified"));

  const paidByInvoice = new Map<string, number>();
  for (const payment of verifiedPayments) {
    paidByInvoice.set(
      payment.invoiceId,
      (paidByInvoice.get(payment.invoiceId) ?? 0) + Number(payment.amount)
    );
  }

  const invoices = invoiceRows.map((row) => {
    const paid = paidByInvoice.get(row.invoice.id) ?? 0;
    return {
      id: row.invoice.id,
      status: row.invoice.status,
      scheme: row.invoice.scheme,
      totalAmount: Number(row.invoice.totalAmount),
      paid,
      remaining: Math.max(Number(row.invoice.totalAmount) - paid, 0),
      createdAt: row.invoice.createdAt,
      registration: row.registration,
      categoryName: row.category.name
    };
  });

  return {
    pending,
    history,
    invoices,
    permissions: { payment: canManagePayment(locals.user?.role) }
  };
};

export const actions: Actions = {
  verify: async ({ request, locals, getClientAddress }) => {
    if (!canManagePayment(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak memverifikasi pembayaran." });
    }

    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");

    if (!id) return fail(400, { message: "Pembayaran tidak ditemukan." });

    try {
      await verifyPayment(id, locals.user?.id ?? null);
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal memverifikasi pembayaran."
      });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "payment.verify",
      entityType: "payment",
      entityId: id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Pembayaran diverifikasi." };
  },

  reject: async ({ request, locals, getClientAddress }) => {
    if (!canManagePayment(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak menolak pembayaran." });
    }

    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();

    if (!id) return fail(400, { message: "Pembayaran tidak ditemukan." });

    try {
      await rejectPayment(id, locals.user?.id ?? null, reason);
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal menolak pembayaran."
      });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "payment.reject",
      entityType: "payment",
      entityId: id,
      metadata: { reason },
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Pembayaran ditolak." };
  }
};
