import { error, fail } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { recordCashPayment } from "$lib/server/ppdb/payment.service";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

const ALLOWED_STATUS = ["submitted", "verified", "accepted", "rejected", "checked_in"] as const;
type RegistrationStatus = (typeof ALLOWED_STATUS)[number];

export const load: PageServerLoad = async ({ params }) => {
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

  const guardians = await db
    .select()
    .from(table.guardian)
    .where(eq(table.guardian.registrationId, registration.id));

  const addresses = await db
    .select()
    .from(table.address)
    .where(eq(table.address.registrationId, registration.id));

  const checklist = await db
    .select()
    .from(table.registrationChecklist)
    .where(eq(table.registrationChecklist.registrationId, registration.id));

  const documents = await db
    .select()
    .from(table.registrationDocument)
    .where(eq(table.registrationDocument.registrationId, registration.id));

  const [invoice] = await db
    .select()
    .from(table.invoice)
    .where(eq(table.invoice.registrationId, registration.id));

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
        .orderBy(asc(table.payment.createdAt))
    : [];

  return {
    registration: {
      ...registration,
      photoPath: registration.photoPath
    },
    category: category ? { name: category.name, institutionName: category.institutionName } : null,
    academicYear: wave?.academicYear ?? "",
    guardians,
    addresses,
    checklist,
    documents: documents.map((document) => ({
      id: document.id,
      itemKey: document.itemKey,
      originalName: document.originalName
    })),
    invoice: invoice
      ? {
          id: invoice.id,
          totalAmount: Number(invoice.totalAmount),
          scheme: invoice.scheme,
          status: invoice.status
        }
      : null,
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
      createdAt: item.createdAt,
      proofPath: item.proofPath
    }))
  };
};

export const actions: Actions = {
  status: async ({ params, request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const status = String(formData.get("status") ?? "") as RegistrationStatus;
    const reason = String(formData.get("reason") ?? "").trim();

    if (!ALLOWED_STATUS.includes(status)) {
      return fail(400, { message: "Status tidak valid." });
    }

    const [registration] = await db
      .select()
      .from(table.registration)
      .where(eq(table.registration.id, params.id));

    if (!registration) return fail(404, { message: "Pendaftaran tidak ditemukan." });

    if (status === "checked_in" && registration.status !== "accepted") {
      return fail(400, { message: "Santri harus diterima terlebih dahulu sebelum check-in." });
    }

    const now = new Date();
    const patch: Partial<typeof table.registration.$inferInsert> = {
      status,
      updatedAt: now
    };

    if (status === "verified") {
      patch.verifiedAt = now;
      patch.verifiedBy = locals.user?.id ?? null;
    }
    if (status === "accepted") {
      patch.acceptedAt = now;
      patch.rejectionReason = null;
    }
    if (status === "rejected") {
      patch.rejectedAt = now;
      patch.rejectionReason = reason || "Tidak memenuhi persyaratan.";
    }
    if (status === "checked_in") {
      patch.checkedInAt = now;
      patch.checkedInBy = locals.user?.id ?? null;
    }

    await db
      .update(table.registration)
      .set(patch)
      .where(eq(table.registration.id, params.id));

    await logAudit({
      userId: locals.user?.id,
      action: `registration.${status}`,
      entityType: "registration",
      entityId: params.id,
      metadata: reason ? { reason } : null,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Status pendaftaran diperbarui." };
  },

  notes: async ({ params, request }) => {
    const formData = await request.formData();
    const notes = String(formData.get("notes") ?? "").trim();

    await db
      .update(table.registration)
      .set({ notes: notes || null, updatedAt: new Date() })
      .where(eq(table.registration.id, params.id));

    return { success: true, message: "Catatan disimpan." };
  },

  cash: async ({ params, request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const invoiceId = String(formData.get("invoiceId") ?? "");
    const installmentId = String(formData.get("installmentId") ?? "").trim() || null;
    const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d.]/g, ""));
    const note = String(formData.get("note") ?? "").trim();

    if (!invoiceId || !Number.isFinite(amount) || amount <= 0) {
      return fail(400, { message: "Nominal pembayaran tunai tidak valid." });
    }

    await recordCashPayment({
      invoiceId,
      installmentId,
      amount,
      adminId: locals.user?.id ?? null,
      note
    });

    await logAudit({
      userId: locals.user?.id,
      action: "payment.cash",
      entityType: "invoice",
      entityId: invoiceId,
      metadata: { amount, registrationId: params.id },
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Pembayaran tunai dicatat." };
  }
};
