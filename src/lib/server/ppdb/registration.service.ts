import { randomInt } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { CHECKLIST_ITEMS, DOCUMENT_ITEMS } from "$lib/types/registration";
import type { RegistrationPayload } from "./schema";
import { buildInstallmentAmounts } from "./installment";
import { saveUpload } from "./storage";
import { getOpenWave } from "./wave.service";

type CreateRegistrationInput = {
  payload: RegistrationPayload;
  photo: File | null;
  documents?: Array<{ key: string; file: File }>;
  source: "online" | "offline";
  createdBy?: number | null;
  accountId?: string | null;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const CODE_PREFIX = "NH-";
const CODE_MAX_ATTEMPTS = 5;

/** Kode acak enam digit, mis. NH-482913. */
function generateCode(): string {
  return `${CODE_PREFIX}${randomInt(100_000, 1_000_000)}`;
}

export type CreateRegistrationResult = {
  id: string;
  code: string;
  hasInvoice: boolean;
  totalAmount: number;
};

export async function createRegistration(
  input: CreateRegistrationInput
): Promise<CreateRegistrationResult> {
  const { payload } = input;

  const wave = await getOpenWave();

  if (!wave) {
    throw new Error("Pendaftaran sedang ditutup. Silakan cek jadwal gelombang berikutnya.");
  }

  const [category] = await db
    .select()
    .from(table.santriCategory)
    .where(
      and(
        eq(table.santriCategory.code, payload.categoryCode),
        eq(table.santriCategory.isActive, true)
      )
    );

  if (!category) {
    throw new Error("Kategori santri tidak ditemukan atau sudah nonaktif.");
  }

  const [duplicate] = await db
    .select({ code: table.registration.code })
    .from(table.registration)
    .where(
      and(
        eq(table.registration.waveId, wave.id),
        eq(table.registration.nik, payload.student.nik),
        ne(table.registration.status, "rejected")
      )
    )
    .limit(1);

  if (duplicate) {
    throw new Error(
      `NIK ini sudah terdaftar pada gelombang ini dengan kode ${duplicate.code}.`
    );
  }

  let photoPath: string | null = null;
  if (input.photo) {
    photoPath = await saveUpload(input.photo, "photos", ["image"]);
  }

  const allowedDocumentKeys = new Set(DOCUMENT_ITEMS.map((item) => item.key));
  const savedDocuments: Array<{ key: string; filePath: string; originalName: string }> = [];

  for (const document of input.documents ?? []) {
    if (!allowedDocumentKeys.has(document.key)) continue;
    if (!document.file || document.file.size === 0) continue;

    const filePath = await saveUpload(document.file, "documents", ["image", "document"]);
    savedDocuments.push({
      key: document.key,
      filePath,
      originalName: document.file.name || "berkas"
    });
  }

  // Ambil rencana biaya dan komponen wajib.
  const [plan] = await db
    .select()
    .from(table.feePlan)
    .where(
      and(
        eq(table.feePlan.waveId, wave.id),
        eq(table.feePlan.categoryId, category.id),
        eq(table.feePlan.isActive, true)
      )
    );

  const items = plan
    ? await db.select().from(table.feePlanItem).where(eq(table.feePlanItem.feePlanId, plan.id))
    : [];

  const installableItems = items.filter((item) => item.isMandatory);
  const totalAmount = installableItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const hasInvoice = plan !== undefined && totalAmount > 0;

  const result = await db.transaction(async (tx) => {
    const values: Omit<typeof table.registration.$inferInsert, "code"> = {
      waveId: wave.id,
      categoryId: category.id,
      accountId: input.accountId ?? null,
      source: input.source,
      status: "submitted",
      createdBy: input.createdBy ?? null,
      fullName: payload.student.fullName,
      gender: payload.student.gender,
      birthPlace: payload.student.birthPlace,
      birthDate: payload.student.birthDate,
      religion: payload.student.religion,
      nationality: payload.student.nationality,
      nik: payload.student.nik,
      kkNumber: payload.student.kkNumber,
      nisn: payload.student.nisn,
      localNis: payload.student.localNis,
      siblingCount: payload.student.siblingCount,
      birthOrder: payload.student.birthOrder,
      aspiration: payload.student.aspiration,
      hobby: payload.student.hobby,
      phone: payload.student.phone,
      email: payload.student.email,
      schoolName: payload.student.schoolName,
      schoolNpsn: payload.student.schoolNpsn,
      kipNumber: payload.student.kipNumber,
      photoPath
    };

    let registration: typeof table.registration.$inferSelect | null = null;

    for (let attempt = 0; attempt < CODE_MAX_ATTEMPTS && !registration; attempt += 1) {
      const [created] = await tx
        .insert(table.registration)
        .values({ ...values, code: generateCode() })
        .onConflictDoNothing({ target: table.registration.code })
        .returning();
      registration = created ?? null;
    }

    if (!registration) {
      throw new Error("Gagal membuat kode pendaftaran unik. Silakan coba lagi.");
    }

    await tx.insert(table.guardian).values([
      {
        registrationId: registration.id,
        type: "father",
        name: payload.father.name,
        status: payload.father.status,
        nationality: payload.father.nationality,
        nik: payload.father.nik,
        birthPlace: payload.father.birthPlace,
        birthDate: payload.father.birthDate,
        lastEducation: payload.father.lastEducation,
        occupation: payload.father.occupation,
        monthlyIncome: payload.father.monthlyIncome,
        phone: payload.father.phone,
        kksNumber: payload.father.kksNumber
      },
      {
        registrationId: registration.id,
        type: "mother",
        name: payload.mother.name,
        status: payload.mother.status,
        nationality: payload.mother.nationality,
        nik: payload.mother.nik,
        birthPlace: payload.mother.birthPlace,
        birthDate: payload.mother.birthDate,
        lastEducation: payload.mother.lastEducation,
        occupation: payload.mother.occupation,
        monthlyIncome: payload.mother.monthlyIncome,
        phone: payload.mother.phone
      }
    ]);

    if (payload.wali) {
      await tx.insert(table.guardian).values({
        registrationId: registration.id,
        type: "guardian",
        name: payload.wali.name,
        status: "alive",
        nationality: "WNI",
        phone: payload.wali.phone,
        relationship: payload.wali.relationship
      });
    }

    const addressRows: (typeof table.address.$inferInsert)[] = [
      {
        registrationId: registration.id,
        type: "father",
        ...payload.fatherAddress
      }
    ];

    if (!payload.studentAddressSame && payload.studentAddress) {
      addressRows.push({
        registrationId: registration.id,
        type: "student",
        ...payload.studentAddress
      });
    }

    await tx.insert(table.address).values(addressRows);

    const checklistKeys = new Set(payload.checklist);
    await tx.insert(table.registrationChecklist).values(
      CHECKLIST_ITEMS.map((item) => ({
        registrationId: registration.id,
        itemKey: item.key,
        isChecked: checklistKeys.has(item.key)
      }))
    );

    if (savedDocuments.length > 0) {
      await tx.insert(table.registrationDocument).values(
        savedDocuments.map((document) => ({
          registrationId: registration.id,
          itemKey: document.key,
          filePath: document.filePath,
          originalName: document.originalName
        }))
      );
    }

    if (hasInvoice) {
      const [invoice] = await tx
        .insert(table.invoice)
        .values({
          registrationId: registration.id,
          totalAmount,
          scheme: payload.scheme,
          status: "unpaid"
        })
        .returning();

      if (installableItems.length > 0) {
        await tx.insert(table.invoiceItem).values(
          installableItems.map((item, index) => ({
            invoiceId: invoice.id,
            name: item.name,
            amount: Number(item.amount),
            scope: item.scope,
            isRecurring: item.isRecurring,
            sortOrder: item.sortOrder || index
          }))
        );
      }

      const amounts = buildInstallmentAmounts(totalAmount, payload.scheme);
      const today = new Date();

      await tx.insert(table.installment).values(
        amounts.map((amount, index) => ({
          invoiceId: invoice.id,
          sequence: index + 1,
          amount,
          dueDate: isoDate(addDays(today, index * 30)),
          status: "unpaid" as const
        }))
      );
    }

    return { id: registration.id, code: registration.code };
  });

  return { ...result, hasInvoice, totalAmount };
}
