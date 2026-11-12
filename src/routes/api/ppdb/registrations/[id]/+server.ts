import { json } from "@sveltejs/kit";
import { and, eq, ne } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { registrationPayloadSchema } from "$lib/server/ppdb/schema";
import { saveUpload } from "$lib/server/ppdb/storage";
import { logAudit } from "$lib/server/services/audit.service";
import { CHECKLIST_ITEMS, DOCUMENT_ITEMS } from "$lib/types/registration";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, params, locals, getClientAddress }) => {
  if (!locals.ppdbAccount) {
    return json({ message: "Sesi akun sudah berakhir. Silakan masuk kembali." }, { status: 401 });
  }

  const [registration] = await db
    .select()
    .from(table.registration)
    .where(eq(table.registration.id, params.id));

  if (!registration || registration.accountId !== locals.ppdbAccount.id) {
    return json({ message: "Pendaftaran tidak ditemukan." }, { status: 404 });
  }

  if (registration.status !== "needs_revision") {
    return json(
      { message: "Pendaftaran ini tidak sedang dalam status perlu revisi." },
      { status: 400 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return json({ message: "Format permintaan tidak valid." }, { status: 400 });
  }

  const raw = formData.get("data");
  if (typeof raw !== "string") {
    return json({ message: "Data pendaftaran tidak ditemukan." }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return json({ message: "Data pendaftaran tidak dapat dibaca." }, { status: 400 });
  }

  const parsed = registrationPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return json(
      {
        message: "Periksa kembali isian yang ditandai.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 422 }
    );
  }

  const payload = parsed.data;

  const [category] = await db
    .select()
    .from(table.santriCategory)
    .where(eq(table.santriCategory.id, registration.categoryId));

  if (!category || category.code !== payload.categoryCode) {
    return json({ message: "Kategori pendaftaran tidak dapat diubah." }, { status: 400 });
  }

  const [duplicate] = await db
    .select({ code: table.registration.code })
    .from(table.registration)
    .where(
      and(
        eq(table.registration.waveId, registration.waveId),
        eq(table.registration.nik, payload.student.nik),
        ne(table.registration.id, registration.id),
        ne(table.registration.status, "rejected")
      )
    )
    .limit(1);

  if (duplicate) {
    return json(
      {
        message: `NIK ini sudah terdaftar pada gelombang ini dengan kode ${duplicate.code}.`
      },
      { status: 400 }
    );
  }

  let photoPath = registration.photoPath;

  try {
    const photoEntry = formData.get("photo");
    if (photoEntry instanceof File && photoEntry.size > 0) {
      photoPath = await saveUpload(photoEntry, "photos", ["image"]);
    }
  } catch (error) {
    return json(
      { message: error instanceof Error ? error.message : "Gagal mengunggah foto." },
      { status: 400 }
    );
  }

  const allowedDocumentKeys = new Set(DOCUMENT_ITEMS.map((item) => item.key));
  const savedDocuments: Array<{ key: string; filePath: string; originalName: string }> = [];

  try {
    for (const [field, value] of formData.entries()) {
      if (!field.startsWith("doc:")) continue;
      const key = field.slice(4);
      if (!allowedDocumentKeys.has(key)) continue;
      if (!(value instanceof File) || value.size === 0) continue;

      const filePath = await saveUpload(value, "documents", ["image", "document"]);
      savedDocuments.push({
        key,
        filePath,
        originalName: value.name || "berkas"
      });
    }
  } catch (error) {
    return json(
      { message: error instanceof Error ? error.message : "Gagal mengunggah berkas." },
      { status: 400 }
    );
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(table.registration)
        .set({
          status: "submitted",
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
          photoPath,
          rejectionReason: null,
          revisionNote: null,
          rejectedAt: null,
          updatedAt: new Date()
        })
        .where(eq(table.registration.id, registration.id));

      await tx.delete(table.guardian).where(eq(table.guardian.registrationId, registration.id));

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
        },
        ...(payload.wali
          ? [
              {
                registrationId: registration.id,
                type: "guardian" as const,
                name: payload.wali.name,
                status: "alive" as const,
                nationality: "WNI",
                phone: payload.wali.phone,
                relationship: payload.wali.relationship
              }
            ]
          : [])
      ]);

      await tx.delete(table.address).where(eq(table.address.registrationId, registration.id));

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
      for (const item of CHECKLIST_ITEMS) {
        if (!checklistKeys.has(item.key)) continue;

        await tx
          .update(table.registrationChecklist)
          .set({ isChecked: true })
          .where(
            and(
              eq(table.registrationChecklist.registrationId, registration.id),
              eq(table.registrationChecklist.itemKey, item.key)
            )
          );
      }

      for (const document of savedDocuments) {
        await tx
          .insert(table.registrationDocument)
          .values({
            registrationId: registration.id,
            itemKey: document.key,
            filePath: document.filePath,
            originalName: document.originalName
          })
          .onConflictDoUpdate({
            target: [table.registrationDocument.registrationId, table.registrationDocument.itemKey],
            set: {
              filePath: document.filePath,
              originalName: document.originalName
            }
          });
      }
    });
  } catch (error) {
    console.error("[ppdb] gagal menyimpan revisi", error);
    return json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Perbaikan data gagal disimpan. Silakan coba lagi."
      },
      { status: 400 }
    );
  }

  await logAudit({
    userId: null,
    action: "registration.revise",
    entityType: "registration",
    entityId: registration.id,
    metadata: { code: registration.code },
    ipAddress: getClientAddress()
  });

  return json({ id: registration.id, code: registration.code, updated: true });
};
