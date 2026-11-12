import { error, fail } from "@sveltejs/kit";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import {
  recalculateInvoice,
  recordCashPayment,
  rejectPayment,
  verifyPayment
} from "$lib/server/ppdb/payment.service";
import { syncSantriFromInvoice } from "$lib/server/ppdb/santri.service";
import { buildInstallmentAmounts } from "$lib/server/ppdb/installment";
import { canManagePayment } from "$lib/server/roles";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const [registration] = await db
    .select()
    .from(table.registration)
    .where(eq(table.registration.id, params.id));

  if (!registration) error(404, "Pendaftaran tidak ditemukan.");

  const [category] = await db
    .select()
    .from(table.santriCategory)
    .where(eq(table.santriCategory.id, registration.categoryId));

  const [wave] = await db
    .select()
    .from(table.registrationWave)
    .where(eq(table.registrationWave.id, registration.waveId));

  const [invoice] = await db
    .select()
    .from(table.invoice)
    .where(eq(table.invoice.registrationId, registration.id));

  const invoiceItems = invoice
    ? await db
        .select()
        .from(table.invoiceItem)
        .where(eq(table.invoiceItem.invoiceId, invoice.id))
        .orderBy(asc(table.invoiceItem.sortOrder), asc(table.invoiceItem.createdAt))
    : [];

  const installments = invoice
    ? await db
        .select()
        .from(table.installment)
        .where(eq(table.installment.invoiceId, invoice.id))
        .orderBy(asc(table.installment.sequence))
    : [];

  const payments = invoice
    ? await db
        .select()
        .from(table.payment)
        .where(eq(table.payment.invoiceId, invoice.id))
        .orderBy(desc(table.payment.createdAt))
    : [];

  const [santriRow] = await db
    .select({ id: table.santri.id })
    .from(table.santri)
    .where(eq(table.santri.registrationId, registration.id));

  const paid = payments
    .filter((payment) => payment.status === "verified")
    .reduce((total, payment) => total + Number(payment.amount), 0);

  return {
    registration: {
      id: registration.id,
      code: registration.code,
      fullName: registration.fullName,
      status: registration.status,
      documentsVerifiedAt: registration.documentsVerifiedAt,
      phone: registration.phone
    },
    categoryName: category?.name ?? "-",
    academicYear: wave?.academicYear ?? "",
    invoice: invoice
      ? {
          id: invoice.id,
          totalAmount: Number(invoice.totalAmount),
          scheme: invoice.scheme,
          status: invoice.status
        }
      : null,
    invoiceItems: invoiceItems.map((item) => ({
      id: item.id,
      name: item.name,
      amount: Number(item.amount),
      scope: item.scope,
      isRecurring: item.isRecurring
    })),
    installments: installments.map((item) => ({
      id: item.id,
      sequence: item.sequence,
      amount: Number(item.amount),
      dueDate: item.dueDate,
      status: item.status
    })),
    payments: payments.map((item) => ({
      id: item.id,
      amount: Number(item.amount),
      method: item.method,
      status: item.status,
      proofPath: item.proofPath,
      referenceNumber: item.referenceNumber,
      createdAt: item.createdAt,
      verifiedAt: item.verifiedAt,
      rejectionReason: item.rejectionReason
    })),
    paid,
    remaining: invoice ? Math.max(Number(invoice.totalAmount) - paid, 0) : 0,
    isSantri: Boolean(santriRow),
    canChangeScheme: locals.user?.role === "super_admin",
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
  },

  cash: async ({ params, request, locals, getClientAddress }) => {
    if (!canManagePayment(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mencatat pembayaran." });
    }

    const formData = await request.formData();
    const invoiceId = String(formData.get("invoiceId") ?? "");
    const installmentId = String(formData.get("installmentId") ?? "").trim() || null;
    const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d.]/g, ""));
    const note = String(formData.get("note") ?? "").trim();

    if (!invoiceId || !Number.isFinite(amount) || amount <= 0) {
      return fail(400, { message: "Nominal pembayaran tunai tidak valid." });
    }

    try {
      await recordCashPayment({
        invoiceId,
        installmentId,
        amount,
        adminId: locals.user?.id ?? null,
        note
      });
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal mencatat pembayaran."
      });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "payment.cash",
      entityType: "invoice",
      entityId: invoiceId,
      metadata: { amount, registrationId: params.id },
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Pembayaran tunai dicatat." };
  },

  scheme: async ({ params, request, locals, getClientAddress }) => {
    if (locals.user?.role !== "super_admin") {
      return fail(403, { message: "Hanya super admin yang dapat mengubah skema pembayaran." });
    }

    const formData = await request.formData();
    const scheme = String(formData.get("scheme") ?? "");
    if (scheme !== "full" && scheme !== "installment_3") {
      return fail(400, { message: "Skema pembayaran tidak valid." });
    }

    const [invoice] = await db
      .select()
      .from(table.invoice)
      .where(eq(table.invoice.registrationId, params.id));

    if (!invoice) return fail(404, { message: "Tagihan tidak ditemukan." });
    if (invoice.status === "paid") {
      return fail(400, { message: "Tagihan sudah lunas, skema tidak dapat diubah." });
    }

    const [registration] = await db
      .select({ status: table.registration.status })
      .from(table.registration)
      .where(eq(table.registration.id, params.id));

    if (registration?.status === "rejected") {
      return fail(400, { message: "Pendaftaran ditolak, skema tidak dapat diubah." });
    }

    const amounts = buildInstallmentAmounts(Number(invoice.totalAmount), scheme);
    const today = new Date();

    await db.transaction(async (tx) => {
      await tx.delete(table.installment).where(eq(table.installment.invoiceId, invoice.id));

      await tx.insert(table.installment).values(
        amounts.map((amount, index) => {
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + index * 30);

          return {
            invoiceId: invoice.id,
            sequence: index + 1,
            amount,
            dueDate: dueDate.toISOString().slice(0, 10),
            status: "unpaid" as const
          };
        })
      );

      await tx
        .update(table.invoice)
        .set({ scheme, updatedAt: new Date() })
        .where(eq(table.invoice.id, invoice.id));
    });

    await recalculateInvoice(invoice.id);
    await syncSantriFromInvoice(invoice.id);

    await logAudit({
      userId: locals.user?.id,
      action: "invoice.scheme",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: { scheme, registrationId: params.id },
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Skema pembayaran diperbarui." };
  }
};
