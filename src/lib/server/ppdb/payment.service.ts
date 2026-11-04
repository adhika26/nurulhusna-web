import { and, asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

export async function recalculateInvoice(invoiceId: string): Promise<void> {
  const [invoice] = await db
    .select()
    .from(table.invoice)
    .where(eq(table.invoice.id, invoiceId));

  if (!invoice) return;

  const verified = await db
    .select()
    .from(table.payment)
    .where(
      and(eq(table.payment.invoiceId, invoiceId), eq(table.payment.status, "verified"))
    );

  const totalPaid = verified.reduce((sum, item) => sum + Number(item.amount), 0);
  const total = Number(invoice.totalAmount);

  const status =
    totalPaid <= 0 ? "unpaid" : totalPaid + 0.005 >= total ? "paid" : "partial";

  await db
    .update(table.invoice)
    .set({ status, updatedAt: new Date() })
    .where(eq(table.invoice.id, invoiceId));

  const installments = await db
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
        await db
          .update(table.installment)
          .set({ status: "paid", paidAt: now })
          .where(eq(table.installment.id, installment.id));
      }
    } else if (installment.status !== "unpaid") {
      await db
        .update(table.installment)
        .set({ status: "unpaid", paidAt: null })
        .where(eq(table.installment.id, installment.id));
    }
  }
}

export async function verifyPayment(
  paymentId: string,
  adminId: number | null
): Promise<void> {
  const [payment] = await db
    .select()
    .from(table.payment)
    .where(eq(table.payment.id, paymentId));

  if (!payment) throw new Error("Pembayaran tidak ditemukan.");

  await db
    .update(table.payment)
    .set({
      status: "verified",
      verifiedBy: adminId,
      verifiedAt: new Date(),
      rejectionReason: null
    })
    .where(eq(table.payment.id, paymentId));

  await recalculateInvoice(payment.invoiceId);
}

export async function rejectPayment(
  paymentId: string,
  adminId: number | null,
  reason: string
): Promise<void> {
  const [payment] = await db
    .select()
    .from(table.payment)
    .where(eq(table.payment.id, paymentId));

  if (!payment) throw new Error("Pembayaran tidak ditemukan.");

  await db
    .update(table.payment)
    .set({
      status: "rejected",
      verifiedBy: adminId,
      verifiedAt: new Date(),
      rejectionReason: reason || "Bukti pembayaran tidak valid."
    })
    .where(eq(table.payment.id, paymentId));

  await recalculateInvoice(payment.invoiceId);
}

type CashPaymentInput = {
  invoiceId: string;
  installmentId: string | null;
  amount: number;
  adminId: number | null;
  note?: string;
};

export async function recordCashPayment(input: CashPaymentInput): Promise<void> {
  await db.insert(table.payment).values({
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
  });

  await recalculateInvoice(input.invoiceId);
}
