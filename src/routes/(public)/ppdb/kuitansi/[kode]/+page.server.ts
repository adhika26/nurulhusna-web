import { error, redirect } from "@sveltejs/kit";
import { asc, desc, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { accessCookieName, verifyAccessToken } from "$lib/server/ppdb/access";
import { getSettingMap } from "$lib/server/services/setting.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, cookies, locals }) => {
  const code = params.kode.trim().toUpperCase();

  const [registration] = await db
    .select()
    .from(table.registration)
    .where(eq(table.registration.code, code));

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

  const verifiedPayments = payments.filter((payment) => payment.status === "verified");
  const paidAmount = verifiedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const settings = await getSettingMap();
  const qr = await QRCode.toDataURL(registration.code, {
    width: 320,
    margin: 1,
    color: { dark: "#14532d", light: "#ffffff" }
  });

  return {
    registration: {
      code: registration.code,
      fullName: registration.fullName,
      status: registration.status,
      createdAt: registration.createdAt
    },
    category: category
      ? { name: category.name, institutionName: category.institutionName }
      : null,
    academicYear: wave?.academicYear ?? "",
    invoice: invoice
      ? {
          totalAmount: Number(invoice.totalAmount),
          scheme: invoice.scheme,
          status: invoice.status
        }
      : null,
    invoiceItems: invoiceItems.map((item) => ({
      id: item.id,
      name: item.name,
      amount: Number(item.amount),
      scope: item.scope
    })),
    payments: verifiedPayments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      method: payment.method,
      paidAt: payment.paidAt,
      referenceNumber: payment.referenceNumber
    })),
    paidAmount,
    remaining: invoice ? Math.max(Number(invoice.totalAmount) - paidAmount, 0) : 0,
    site: {
      name: settings.site_name ?? "Pondok Pesantren Nurul Husna",
      address: settings.site_address ?? ""
    },
    qr
  };
};
