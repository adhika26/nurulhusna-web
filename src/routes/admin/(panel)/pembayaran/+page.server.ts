import { fail } from "@sveltejs/kit";
import { desc, eq, ne } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { rejectPayment, verifyPayment } from "$lib/server/ppdb/payment.service";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
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
    .where(eq(table.payment.status, "pending"))
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

  return { pending, history };
};

export const actions: Actions = {
  verify: async ({ request, locals, getClientAddress }) => {
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
