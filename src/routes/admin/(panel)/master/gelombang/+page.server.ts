import { fail } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { waveState } from "$lib/server/ppdb/wave.service";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || String(value).trim() === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export const load: PageServerLoad = async () => {
  const rows = await db
    .select()
    .from(table.registrationWave)
    .orderBy(asc(table.registrationWave.academicYear), asc(table.registrationWave.id));

  return {
    waves: rows.map((wave) => ({ ...wave, state: waveState(wave) }))
  };
};

export const actions: Actions = {
  create: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const academicYear = String(formData.get("academicYear") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim() || null;
    const opensAt = parseDate(formData.get("opensAt"));
    const closesAt = parseDate(formData.get("closesAt"));

    if (!academicYear || !name) {
      return fail(400, { message: "Tahun ajaran dan nama gelombang wajib diisi." });
    }

    const [created] = await db
      .insert(table.registrationWave)
      .values({ academicYear, name, code, opensAt, closesAt, isActive: true })
      .returning({ id: table.registrationWave.id });

    await logAudit({
      userId: locals.user?.id,
      action: "wave.create",
      entityType: "registration_wave",
      entityId: String(created.id),
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Gelombang "${name}" ditambahkan.` };
  },

  update: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const academicYear = String(formData.get("academicYear") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim() || null;
    const opensAt = parseDate(formData.get("opensAt"));
    const closesAt = parseDate(formData.get("closesAt"));

    if (!id || !academicYear || !name) {
      return fail(400, { message: "Data gelombang tidak lengkap." });
    }

    await db
      .update(table.registrationWave)
      .set({ academicYear, name, code, opensAt, closesAt, updatedAt: new Date() })
      .where(eq(table.registrationWave.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: "wave.update",
      entityType: "registration_wave",
      entityId: String(id),
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Gelombang "${name}" diperbarui.` };
  },

  toggle: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));

    if (!id) return fail(400, { message: "Gelombang tidak ditemukan." });

    const [wave] = await db
      .select()
      .from(table.registrationWave)
      .where(eq(table.registrationWave.id, id));

    if (!wave) return fail(400, { message: "Gelombang tidak ditemukan." });

    await db
      .update(table.registrationWave)
      .set({ isActive: !wave.isActive, updatedAt: new Date() })
      .where(eq(table.registrationWave.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: wave.isActive ? "wave.deactivate" : "wave.activate",
      entityType: "registration_wave",
      entityId: String(id),
      ipAddress: getClientAddress()
    });

    return {
      success: true,
      message: `Gelombang "${wave.name}" ${wave.isActive ? "dinonaktifkan" : "diaktifkan"}.`
    };
  }
};
