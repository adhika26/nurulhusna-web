import { error, fail, redirect } from "@sveltejs/kit";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { accessCookieName, verifyAccessToken } from "$lib/server/ppdb/access";
import { saveUpload } from "$lib/server/ppdb/storage";
import type { Actions, PageServerLoad } from "./$types";

async function loadRegistration(code: string) {
  const [registration] = await db
    .select()
    .from(table.registration)
    .where(eq(table.registration.code, code.trim().toUpperCase()));

  return registration ?? null;
}

export const load: PageServerLoad = async ({ params, cookies, locals }) => {
  const registration = await loadRegistration(params.kode);

  if (!registration) error(404, "Kode pendaftaran tidak ditemukan.");

  const accessId = verifyAccessToken(cookies.get(accessCookieName));
  const isOwner = locals.ppdbAccount && registration.accountId === locals.ppdbAccount.id;

  if (!locals.user && !isOwner && accessId !== registration.id) {
    redirect(303, `/ppdb/status?kode=${registration.code}`);
  }

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

  const documents = await db
    .select()
    .from(table.registrationDocument)
    .where(eq(table.registrationDocument.registrationId, registration.id));

  const installments = invoice
    ? await db
        .select()
        .from(table.installment)
        .where(eq(table.installment.invoiceId, invoice.id))
        .orderBy(asc(table.installment.sequence))
    : [];

  const invoiceItems = invoice
    ? await db
        .select()
        .from(table.invoiceItem)
        .where(eq(table.invoiceItem.invoiceId, invoice.id))
        .orderBy(asc(table.invoiceItem.sortOrder), asc(table.invoiceItem.createdAt))
    : [];

  const payments = invoice
    ? await db
        .select()
        .from(table.payment)
        .where(eq(table.payment.invoiceId, invoice.id))
        .orderBy(desc(table.payment.createdAt))
    : [];

  return {
    registration: {
      id: registration.id,
      code: registration.code,
      fullName: registration.fullName,
      status: registration.status,
      phone: registration.phone,
      rejectionReason: registration.rejectionReason,
      revisionNote: registration.revisionNote,
      createdAt: registration.createdAt
    },
    category: category ? { name: category.name, institutionName: category.institutionName } : null,
    academicYear: wave?.academicYear ?? "",
    uploadedDocuments: documents.map((document) => document.itemKey),
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
      paidAt: item.paidAt,
      createdAt: item.createdAt,
      rejectionReason: item.rejectionReason
    }))
  };
};

export const actions: Actions = {
  upload: async ({ params, request, cookies, locals }) => {
    const registration = await loadRegistration(params.kode);

    if (!registration) return fail(404, { message: "Pendaftaran tidak ditemukan." });

    if (registration.status === "rejected") {
      return fail(400, {
        message: "Pendaftaran sudah ditolak. Pembayaran tidak dapat dikirim."
      });
    }

    if (registration.status === "needs_revision") {
      return fail(400, {
        message: "Pendaftaran sedang dalam perbaikan data. Pembayaran belum dapat dikirim."
      });
    }

    const accessId = verifyAccessToken(cookies.get(accessCookieName));
    const isOwner = locals.ppdbAccount && registration.accountId === locals.ppdbAccount.id;

    if (!locals.user && !isOwner && accessId !== registration.id) {
      return fail(403, { message: "Sesi akses sudah berakhir. Silakan cek status ulang." });
    }

    const [invoice] = await db
      .select()
      .from(table.invoice)
      .where(eq(table.invoice.registrationId, registration.id));

    if (!invoice) {
      return fail(400, { message: "Tagihan untuk pendaftaran ini belum tersedia." });
    }

    if (invoice.status === "paid") {
      return fail(400, { message: "Tagihan sudah lunas." });
    }

    const formData = await request.formData();
    const installmentId = String(formData.get("installmentId") ?? "").trim() || null;
    const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d.]/g, ""));
    const paidAtValue = String(formData.get("paidAt") ?? "").trim();
    const referenceNumber = String(formData.get("referenceNumber") ?? "").trim();
    const proof = formData.get("proof");

    if (!Number.isFinite(amount) || amount <= 0) {
      return fail(400, { message: "Nominal pembayaran tidak valid." });
    }

    const verifiedPayments = await db
      .select({ amount: table.payment.amount })
      .from(table.payment)
      .where(
        and(
          eq(table.payment.invoiceId, invoice.id),
          eq(table.payment.status, "verified")
        )
      );

    const paid = verifiedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Number(invoice.totalAmount) - paid;

    if (amount > remaining + 0.005) {
      return fail(400, {
        message: `Nominal melebihi sisa tagihan. Sisa tagihan Rp ${remaining.toLocaleString("id-ID")}.`
      });
    }

    if (!(proof instanceof File) || proof.size === 0) {
      return fail(400, { message: "Bukti pembayaran wajib diunggah." });
    }

    if (installmentId) {
      const [installment] = await db
        .select()
        .from(table.installment)
        .where(eq(table.installment.id, installmentId));

      if (!installment || installment.invoiceId !== invoice.id) {
        return fail(400, { message: "Cicilan tidak sesuai dengan tagihan." });
      }
    }

    const paidAt = paidAtValue ? new Date(paidAtValue) : new Date();

    if (Number.isNaN(paidAt.getTime())) {
      return fail(400, { message: "Tanggal pembayaran tidak valid." });
    }

    let proofPath: string;

    try {
      proofPath = await saveUpload(proof, "payments", ["image", "document"]);
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal mengunggah bukti."
      });
    }

    await db.insert(table.payment).values({
      invoiceId: invoice.id,
      installmentId,
      amount,
      method: "transfer",
      proofPath,
      referenceNumber: referenceNumber || null,
      paidAt,
      status: "pending"
    });

    return {
      success: true,
      message: "Bukti pembayaran dikirim. Menunggu verifikasi pengurus."
    };
  }
};
