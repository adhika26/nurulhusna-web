import { error } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { getSettingMap } from "$lib/server/services/setting.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const code = params.kode.trim().toUpperCase();

  const [registration] = await db
    .select()
    .from(table.registration)
    .where(eq(table.registration.code, code));

  if (!registration) error(404, "Kode pendaftaran tidak ditemukan.");

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

  const installments = invoice
    ? await db
        .select()
        .from(table.installment)
        .where(eq(table.installment.invoiceId, invoice.id))
        .orderBy(asc(table.installment.sequence))
    : [];

  const settings = await getSettingMap();

  const qr = await QRCode.toDataURL(code, {
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
    installments: installments.map((item) => ({
      sequence: item.sequence,
      amount: Number(item.amount),
      dueDate: item.dueDate,
      status: item.status
    })),
    bank: {
      name: settings.bank_name ?? "",
      accountNumber: settings.bank_account_number ?? "",
      accountName: settings.bank_account_name ?? ""
    },
    qr
  };
};
