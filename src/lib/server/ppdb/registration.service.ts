import { and, eq, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { CHECKLIST_ITEMS, DOCUMENT_ITEMS } from "$lib/types/registration";
import type { RegistrationPayload } from "./schema";
import { saveUpload } from "./storage";
import { getOpenWave } from "./wave.service";

type CreateRegistrationInput = {
  payload: RegistrationPayload;
  photo: File | null;
  documents?: Array<{ key: string; file: File }>;
  source: "online" | "offline";
  createdBy?: number | null;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildInstallmentAmounts(total: number, scheme: "full" | "installment_3") {
  if (scheme === "full") return [total];

  const cents = Math.round(total * 100);
  const base = Math.floor(cents / 3);
  return [base / 100, base / 100, (cents - base * 2) / 100];
}

/** Mengambil nomor urut berikutnya secara atomic per (gelombang, kategori). */
async function nextSequence(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  waveId: number,
  categoryId: number
): Promise<number> {
  const rows = await tx.execute(sql`
    INSERT INTO registration_counter (wave_id, category_id, last_number)
    VALUES (${waveId}, ${categoryId}, 1)
    ON CONFLICT (wave_id, category_id)
    DO UPDATE SET last_number = registration_counter.last_number + 1
    RETURNING last_number
  `);

  const first = rows[0] as { last_number: number } | undefined;
  return Number(first?.last_number ?? 1);
}

function yearToken(academicYear: string): string {
  const parts = academicYear.split("/").map((part) => part.trim());
  if (parts.length === 2 && parts[0].length >= 2 && parts[1].length >= 2) {
    return `${parts[0].slice(-2)}${parts[1].slice(-2)}`;
  }
  return academicYear.replace(/\D/g, "").slice(-4);
}

function buildCode(
  academicYear: string,
  categoryCode: string,
  waveCode: string,
  sequence: number
): string {
  return `NH-${yearToken(academicYear)}-${categoryCode}-${waveCode}-${String(sequence).padStart(4, "0")}`;
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
    const sequence = await nextSequence(tx, wave.id, category.id);
    const code = buildCode(wave.academicYear, category.code, wave.code || `G${wave.id}`, sequence);

    const [registration] = await tx
      .insert(table.registration)
      .values({
        code,
        waveId: wave.id,
        categoryId: category.id,
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
      })
      .returning();

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

    return { id: registration.id, code };
  });

  return { ...result, hasInvoice, totalAmount };
}
