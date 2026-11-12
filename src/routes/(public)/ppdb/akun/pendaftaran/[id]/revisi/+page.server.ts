import { error, redirect } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import {
  createEmptyDraft,
  emptyAddress,
  emptyGuardian,
  type AddressDraft,
  type GuardianDraft,
  type RegistrationDraft
} from "$lib/types/registration";
import type { PageServerLoad } from "./$types";

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function guardianDraft(row: typeof table.guardian.$inferSelect | undefined): GuardianDraft {
  if (!row) return emptyGuardian();

  return {
    name: text(row.name),
    status: row.status,
    nationality: text(row.nationality),
    nik: text(row.nik),
    birthPlace: text(row.birthPlace),
    birthDate: text(row.birthDate),
    lastEducation: text(row.lastEducation),
    occupation: text(row.occupation),
    monthlyIncome: text(row.monthlyIncome),
    phone: text(row.phone),
    kksNumber: text(row.kksNumber)
  };
}

function addressDraft(row: typeof table.address.$inferSelect | undefined): AddressDraft {
  if (!row) return emptyAddress();

  return {
    ownershipStatus: text(row.ownershipStatus),
    province: text(row.province),
    regency: text(row.regency),
    district: text(row.district),
    village: text(row.village),
    provinceCode: text(row.provinceCode),
    regencyCode: text(row.regencyCode),
    districtCode: text(row.districtCode),
    villageCode: text(row.villageCode),
    rt: text(row.rt),
    rw: text(row.rw),
    street: text(row.street),
    postalCode: text(row.postalCode),
    distanceKm: text(row.distanceKm),
    transportation: text(row.transportation),
    travelMinutes: text(row.travelMinutes)
  };
}

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.ppdbAccount) {
    redirect(303, `/ppdb/akun/masuk?next=${encodeURIComponent(`/ppdb/akun/pendaftaran/${params.id}/revisi`)}`);
  }

  const [registration] = await db
    .select()
    .from(table.registration)
    .where(eq(table.registration.id, params.id));

  if (!registration || registration.accountId !== locals.ppdbAccount.id) {
    error(404, "Pendaftaran tidak ditemukan.");
  }

  if (registration.status !== "needs_revision") {
    redirect(303, "/ppdb/akun");
  }

  const [category] = await db
    .select()
    .from(table.santriCategory)
    .where(eq(table.santriCategory.id, registration.categoryId));

  if (!category) error(404, "Kategori pendaftaran tidak ditemukan.");

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

  const [invoice] = await db
    .select()
    .from(table.invoice)
    .where(eq(table.invoice.registrationId, registration.id));

  const documents = await db
    .select()
    .from(table.registrationDocument)
    .where(eq(table.registrationDocument.registrationId, registration.id));

  const father = guardians.find((row) => row.type === "father");
  const mother = guardians.find((row) => row.type === "mother");
  const wali = guardians.find((row) => row.type === "guardian");
  const fatherAddress = addresses.find((row) => row.type === "father");
  const studentAddress = addresses.find((row) => row.type === "student");

  const draft: RegistrationDraft = {
    ...createEmptyDraft(category.code),
    categoryCode: category.code,
    scheme: invoice?.scheme ?? "full",
    student: {
      ...createEmptyDraft(category.code).student,
      fullName: text(registration.fullName),
      gender: registration.gender,
      birthPlace: text(registration.birthPlace),
      birthDate: text(registration.birthDate),
      religion: text(registration.religion),
      nationality: text(registration.nationality),
      nik: text(registration.nik),
      kkNumber: text(registration.kkNumber),
      nisn: text(registration.nisn),
      localNis: text(registration.localNis),
      siblingCount: text(registration.siblingCount),
      birthOrder: text(registration.birthOrder),
      aspiration: text(registration.aspiration),
      hobby: text(registration.hobby),
      phone: text(registration.phone),
      email: text(registration.email),
      schoolName: text(registration.schoolName),
      schoolNpsn: text(registration.schoolNpsn),
      kipNumber: text(registration.kipNumber)
    },
    father: guardianDraft(father),
    mother: guardianDraft(mother),
    wali: wali
      ? {
          name: text(wali.name),
          relationship: text(wali.relationship),
          phone: text(wali.phone),
          addressSame: true
        }
      : null,
    fatherAddress: addressDraft(fatherAddress),
    studentAddressSame: !studentAddress,
    studentAddress: addressDraft(studentAddress),
    checklist: checklist.filter((row) => row.isChecked).map((row) => row.itemKey)
  };

  return {
    registrationId: registration.id,
    code: registration.code,
    revisionNote: registration.revisionNote,
    category: {
      code: category.code,
      name: category.name,
      institutionName: category.institutionName
    },
    academicYear: wave?.academicYear ?? "",
    total: invoice ? Number(invoice.totalAmount) : 0,
    existingDocuments: documents.length,
    initialDraft: draft
  };
};
