import { and, asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { notifyPaymentVerified } from "./notification.service";
import { syncSantriTx } from "./santri.service";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recalculateInvoiceTx(tx: Tx, invoiceId: string): Promise<void> {
  const [invoice] = await tx
    .select()
    .from(table.invoice)
    .where(eq(table.invoice.id, invoiceId));

  if (!invoice) return;

  const verified = await tx
    .select()
    .from(table.payment)
    .where(
      and(eq(table.payment.invoiceId, invoiceId), eq(table.payment.status, "verified"))
    );

  const totalPaid = verified.reduce((sum, item) => sum + Number(item.amount), 0);
  const total = Number(invoice.totalAmount);

  const status =
    totalPaid <= 0 ? "unpaid" : totalPaid + 0.005 >= total ? "paid" : "partial";

  await tx
    .update(table.invoice)
    .set({ status, updatedAt: new Date() })
    .where(eq(table.invoice.id, invoiceId));

  const installments = await tx
    .select()
    .from(table.installment)
    .where(eq(table.installment.invoiceId, invoiceId))
    .orderBy(asc(table.installment.sequence));

  let remaining = totalPaid;
  const now = new Date();

  for (const installment of installments) {
    const amount = Number(installment.amount);
    const isCovered = remaining + 0.005 >= amount;

    if (isCovered) {
      remaining -= amount;
      if (installment.status !== "paid") {
        await tx
          .update(table.installment)
          .set({ status: "paid", paidAt: now })
          .where(eq(table.installment.id, installment.id));
      }
    } else if (installment.status !== "unpaid") {
      await tx
        .update(table.installment)
        .set({ status: "unpaid", paidAt: null })
        .where(eq(table.installment.id, installment.id));
    }
  }
}

export async function recalculateInvoice(invoiceId: string): Promise<void> {
  await db.transaction((tx) => recalculateInvoiceTx(tx, invoiceId));
}

export async function verifyPayment(
  paymentId: string,
  adminId: number | null
): Promise<void> {
  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(table.payment)
      .where(eq(table.payment.id, paymentId));

    if (!payment) throw new Error("Pembayaran tidak ditemukan.");
    if (payment.status !== "pending") {
      throw new Error("Hanya pembayaran yang menunggu verifikasi yang dapat diverifikasi.");
    }

    const [invoice] = await tx
      .select()
      .from(table.invoice)
      .where(eq(table.invoice.id, payment.invoiceId));

    if (!invoice) throw new Error("Tagihan tidak ditemukan.");
    if (invoice.status === "paid") throw new Error("Tagihan sudah lunas.");

    const [registration] = await tx
      .select({ status: table.registration.status })
      .from(table.registration)
      .where(eq(table.registration.id, invoice.registrationId));

    if (registration?.status === "rejected") {
      throw new Error("Pendaftaran sudah ditolak. Pembayaran tidak dapat diproses.");
    }

    if (registration?.status === "needs_revision") {
      throw new Error("Pendaftaran sedang dalam perbaikan data. Pembayaran belum dapat diproses.");
    }

    const verified = await tx
      .select({ amount: table.payment.amount })
      .from(table.payment)
      .where(
        and(
          eq(table.payment.invoiceId, payment.invoiceId),
          eq(table.payment.status, "verified")
        )
      );

    const paid = verified.reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = Number(invoice.totalAmount) - paid;

    if (Number(payment.amount) > remaining + 0.005) {
      throw new Error(
        `Nominal melebihi sisa tagihan. Sisa tagihan Rp ${remaining.toLocaleString("id-ID")}.`
      );
    }

    await tx
      .update(table.payment)
      .set({
        status: "verified",
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: null
      })
      .where(eq(table.payment.id, paymentId));

    await recalculateInvoiceTx(tx, payment.invoiceId);
    await syncSantriTx(tx, invoice.registrationId);
  });

  void notifyPaymentVerified(paymentId).catch((error) => {
    console.error("[wa] gagal mengirim notifikasi pembayaran", error);
  });
}

export async function rejectPayment(
  paymentId: string,
  adminId: number | null,
  reason: string
): Promise<void> {
  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(table.payment)
      .where(eq(table.payment.id, paymentId));

    if (!payment) throw new Error("Pembayaran tidak ditemukan.");
    if (payment.status !== "pending") {
      throw new Error("Hanya pembayaran yang menunggu verifikasi yang dapat ditolak.");
    }

    await tx
      .update(table.payment)
      .set({
        status: "rejected",
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason || "Bukti pembayaran tidak valid."
      })
      .where(eq(table.payment.id, paymentId));

    await recalculateInvoiceTx(tx, payment.invoiceId);
  });
}

type CashPaymentInput = {
  invoiceId: string;
  installmentId: string | null;
  amount: number;
  adminId: number | null;
  note?: string;
};

export async function recordCashPayment(input: CashPaymentInput): Promise<void> {
  const paymentId = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(table.invoice)
      .where(eq(table.invoice.id, input.invoiceId));

    if (!invoice) throw new Error("Tagihan tidak ditemukan.");
    if (invoice.status === "paid") throw new Error("Tagihan sudah lunas.");

    const [registration] = await tx
      .select({ status: table.registration.status })
      .from(table.registration)
      .where(eq(table.registration.id, invoice.registrationId));

    if (registration?.status === "rejected") {
      throw new Error("Pendaftaran sudah ditolak. Pembayaran tidak dapat diproses.");
    }

    if (registration?.status === "needs_revision") {
      throw new Error("Pendaftaran sedang dalam perbaikan data. Pembayaran belum dapat diproses.");
    }

    const verified = await tx
      .select({ amount: table.payment.amount })
      .from(table.payment)
      .where(
        and(
          eq(table.payment.invoiceId, input.invoiceId),
          eq(table.payment.status, "verified")
        )
      );

    const paid = verified.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Number(invoice.totalAmount) - paid;

    if (input.amount > remaining + 0.005) {
      throw new Error(
        `Nominal melebihi sisa tagihan. Sisa tagihan Rp ${remaining.toLocaleString("id-ID")}.`
      );
    }

    const [created] = await tx
      .insert(table.payment)
      .values({
        invoiceId: input.invoiceId,
        installmentId: input.installmentId,
        amount: input.amount,
        method: "cash",
        status: "verified",
        paidAt: new Date(),
        verifiedBy: input.adminId,
        verifiedAt: new Date(),
        recordedBy: input.adminId,
        referenceNumber: input.note || null
      })
      .returning({ id: table.payment.id });

    await recalculateInvoiceTx(tx, input.invoiceId);
    await syncSantriTx(tx, invoice.registrationId);

    return created.id;
  });

  void notifyPaymentVerified(paymentId).catch((error) => {
    console.error("[wa] gagal mengirim notifikasi pembayaran", error);
  });
}
