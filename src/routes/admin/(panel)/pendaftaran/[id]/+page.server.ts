import { error, fail } from "@sveltejs/kit";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { recordCashPayment } from "$lib/server/ppdb/payment.service";
import { syncSantriFromRegistration } from "$lib/server/ppdb/santri.service";
import { canTransition } from "$lib/server/ppdb/registration-flow";
import { notifyRegistrationStatus } from "$lib/server/ppdb/notification.service";
import { logAudit } from "$lib/server/services/audit.service";
import { canManagePayment, canManageRegistration } from "$lib/server/roles";
import { CHECKLIST_ITEMS } from "$lib/types/registration";
import type { Actions, PageServerLoad } from "./$types";

const ALLOWED_STATUS = [
  "submitted",
  "verified",
  "accepted",
  "rejected",
  "checked_in",
  "documents_complete",
  "needs_revision"
] as const;
type RegistrationStatus = (typeof ALLOWED_STATUS)[number];

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

  const invoiceItems = invoice
    ? await db
        .select()
        .from(table.invoiceItem)
        .where(eq(table.invoiceItem.invoiceId, invoice.id))
        .orderBy(asc(table.invoiceItem.sortOrder), asc(table.invoiceItem.createdAt))
    : [];

  const [santriRow] = await db
    .select()
    .from(table.santri)
    .where(eq(table.santri.registrationId, registration.id));

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
    invoiceItems: invoiceItems.map((item) => ({
      id: item.id,
      name: item.name,
      amount: Number(item.amount),
      scope: item.scope,
      isRecurring: item.isRecurring
    })),
    santri: santriRow ?? null,
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
    })),
    canReopen: locals.user?.role === "super_admin",
    permissions: {
      registration: canManageRegistration(locals.user?.role),
      payment: canManagePayment(locals.user?.role)
    }
  };
};

export const actions: Actions = {
  status: async ({ params, request, locals, getClientAddress }) => {
    if (!canManageRegistration(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah status pendaftaran." });
    }

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

    if (!canTransition(registration.status, status)) {
      return fail(400, {
        message: "Status pendaftaran tidak dapat diubah ke tahap tersebut."
      });
    }

    if (status === "documents_complete") {
      const checklist = await db
        .select()
        .from(table.registrationChecklist)
        .where(eq(table.registrationChecklist.registrationId, params.id));

      const missing = CHECKLIST_ITEMS.filter(
        (item) =>
          item.required &&
          !checklist.some((row) => row.itemKey === item.key && row.isChecked)
      );

      if (missing.length > 0) {
        return fail(400, {
          message: `Berkas wajib belum lengkap: ${missing.map((item) => item.label).join(", ")}.`
        });
      }
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
      patch.revisionNote = null;
    }
    if (status === "rejected") {
      patch.rejectedAt = now;
      patch.rejectionReason = reason || "Tidak memenuhi persyaratan.";
      patch.revisionNote = null;
    }
    if (status === "needs_revision") {
      patch.revisionNote = reason || "Perbaiki data pendaftaran.";
      patch.rejectionReason = null;
    }
    if (status === "checked_in") {
      patch.checkedInAt = now;
      patch.checkedInBy = locals.user?.id ?? null;
    }
    if (status === "documents_complete") {
      patch.documentsVerifiedAt = now;
      patch.documentsVerifiedBy = locals.user?.id ?? null;
    }

    await db
      .update(table.registration)
      .set(patch)
      .where(eq(table.registration.id, params.id));

    let finalStatus: string = status;

    if (status === "documents_complete") {
      const result = await syncSantriFromRegistration(params.id);
      if (result.created) finalStatus = "enrolled";
    }

    void notifyRegistrationStatus(params.id, finalStatus, reason).catch((error) => {
      console.error("[wa] gagal mengirim notifikasi status", error);
    });

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

  reopen: async ({ params, locals, getClientAddress }) => {
    if (locals.user?.role !== "super_admin") {
      return fail(403, { message: "Hanya super admin yang dapat membuka kembali pendaftaran." });
    }

    const [registration] = await db
      .select()
      .from(table.registration)
      .where(eq(table.registration.id, params.id));

    if (!registration) return fail(404, { message: "Pendaftaran tidak ditemukan." });
    if (registration.status !== "rejected") {
      return fail(400, { message: "Hanya pendaftaran yang ditolak yang dapat dibuka kembali." });
    }

    const [duplicate] = await db
      .select({ code: table.registration.code })
      .from(table.registration)
      .where(
        and(
          eq(table.registration.waveId, registration.waveId),
          eq(table.registration.nik, registration.nik),
          ne(table.registration.id, registration.id),
          ne(table.registration.status, "rejected")
        )
      )
      .limit(1);

    if (duplicate) {
      return fail(400, {
        message: `Tidak dapat dibuka kembali karena NIK ini sudah punya pendaftaran aktif dengan kode ${duplicate.code}.`
      });
    }

    await db
      .update(table.registration)
      .set({
        status: "submitted",
        rejectedAt: null,
        rejectionReason: null,
        revisionNote: null,
        updatedAt: new Date()
      })
      .where(eq(table.registration.id, params.id));

    await logAudit({
      userId: locals.user?.id,
      action: "registration.reopen",
      entityType: "registration",
      entityId: params.id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Pendaftaran dibuka kembali ke status terkirim." };
  },

  checklist: async ({ params, request, locals }) => {
    if (!canManageRegistration(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah kelengkapan berkas." });
    }

    const formData = await request.formData();
    const checked = new Set(formData.getAll("items").map((value) => String(value)));
    const existing = await db
      .select()
      .from(table.registrationChecklist)
      .where(eq(table.registrationChecklist.registrationId, params.id));

    await db.transaction(async (tx) => {
      for (const item of CHECKLIST_ITEMS) {
        const isChecked = checked.has(item.key);
        const row = existing.find((entry) => entry.itemKey === item.key);

        if (row) {
          await tx
            .update(table.registrationChecklist)
            .set({ isChecked })
            .where(eq(table.registrationChecklist.id, row.id));
        } else {
          await tx.insert(table.registrationChecklist).values({
            registrationId: params.id,
            itemKey: item.key,
            isChecked
          });
        }
      }
    });

    await syncSantriFromRegistration(params.id);

    await logAudit({
      userId: locals.user?.id,
      action: "registration.checklist",
      entityType: "registration",
      entityId: params.id,
      metadata: { checked: [...checked] }
    });

    return { success: true, message: "Kelengkapan berkas disimpan." };
  },

  notes: async ({ params, request, locals }) => {
    if (!canManageRegistration(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah catatan." });
    }

    const formData = await request.formData();
    const notes = String(formData.get("notes") ?? "").trim();

    await db
      .update(table.registration)
      .set({ notes: notes || null, updatedAt: new Date() })
      .where(eq(table.registration.id, params.id));

    return { success: true, message: "Catatan disimpan." };
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
