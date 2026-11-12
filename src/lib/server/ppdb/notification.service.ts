import { and, asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { sendWhatsAppMessage } from "./whatsapp.service";

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

async function registrationPhone(registrationId: string): Promise<string | null> {
  const [registration] = await db
    .select({ phone: table.registration.phone })
    .from(table.registration)
    .where(eq(table.registration.id, registrationId));

  if (registration?.phone) return registration.phone;

  const guardians = await db
    .select({ phone: table.guardian.phone, type: table.guardian.type })
    .from(table.guardian)
    .where(eq(table.guardian.registrationId, registrationId))
    .orderBy(asc(table.guardian.type));

  for (const type of ["father", "mother", "guardian"]) {
    const guardian = guardians.find((item) => item.type === type && item.phone);
    if (guardian?.phone) return guardian.phone;
  }

  return null;
}

async function send(
  registrationId: string,
  message: string
): Promise<void> {
  const phone = await registrationPhone(registrationId);
  if (!phone) return;

  try {
    await sendWhatsAppMessage(phone, message);
  } catch (error) {
    console.error("[wa] gagal mengirim notifikasi", error);
  }
}

export async function notifyRegistrationStatus(
  registrationId: string,
  status: string,
  note?: string | null
): Promise<void> {
  const [registration] = await db
    .select({
      code: table.registration.code,
      fullName: table.registration.fullName,
      revisionNote: table.registration.revisionNote,
      rejectionReason: table.registration.rejectionReason
    })
    .from(table.registration)
    .where(eq(table.registration.id, registrationId));

  if (!registration) return;

  const identity = `${registration.fullName} (${registration.code})`;
  let message = "";

  if (status === "accepted") {
    message = `Pendaftaran ${identity} telah DITERIMA. Silakan datang ke pondok untuk check-in dan melengkapi berkas.`;
  } else if (status === "rejected") {
    message = `Pendaftaran ${identity} DITOLAK. Alasan: ${note || registration.rejectionReason || "tidak memenuhi persyaratan"}.`;
  } else if (status === "needs_revision") {
    message = `Pendaftaran ${identity} perlu diperbaiki: ${note || registration.revisionNote || "silakan periksa kembali data Anda"}. Buka akun PPDB untuk memperbaiki data.`;
  } else if (status === "checked_in") {
    message = `Check-in ${identity} berhasil dicatat. Silakan lengkapi berkas fisik di pondok.`;
  } else if (status === "documents_complete") {
    message = `Berkas ${identity} sudah lengkap. Silakan lanjutkan pembayaran dan tunjukkan bukti pembayaran ke staff keuangan.`;
  } else if (status === "enrolled") {
    message = `Selamat, ${identity} resmi menjadi santri Pondok Pesantren Nurul Husna.`;
  } else {
    return;
  }

  await send(registrationId, message);
}

export async function notifyPaymentVerified(paymentId: string): Promise<void> {
  const [row] = await db
    .select({
      payment: table.payment,
      invoice: table.invoice,
      registration: {
        id: table.registration.id,
        code: table.registration.code,
        fullName: table.registration.fullName
      }
    })
    .from(table.payment)
    .innerJoin(table.invoice, eq(table.payment.invoiceId, table.invoice.id))
    .innerJoin(table.registration, eq(table.invoice.registrationId, table.registration.id))
    .where(eq(table.payment.id, paymentId));

  if (!row) return;

  const verified = await db
    .select({ amount: table.payment.amount })
    .from(table.payment)
    .where(
      and(
        eq(table.payment.invoiceId, row.invoice.id),
        eq(table.payment.status, "verified")
      )
    );

  const paid = verified.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = Math.max(Number(row.invoice.totalAmount) - paid, 0);

  const [santri] = await db
    .select({ id: table.santri.id })
    .from(table.santri)
    .where(eq(table.santri.registrationId, row.registration.id));

  const identity = `${row.registration.fullName} (${row.registration.code})`;
  const parts = [
    `Pembayaran ${rupiah(Number(row.payment.amount))} untuk ${identity} telah diverifikasi.`,
    remaining > 0 ? `Sisa tagihan: ${rupiah(remaining)}.` : "Tagihan sudah lunas.",
    santri ? "Data santri sudah aktif." : ""
  ].filter(Boolean);

  await send(row.registration.id, parts.join(" "));
}
