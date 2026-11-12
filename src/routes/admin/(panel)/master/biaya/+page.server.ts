import { fail } from "@sveltejs/kit";
import { and, asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const waves = await db
    .select()
    .from(table.registrationWave)
    .orderBy(asc(table.registrationWave.academicYear), asc(table.registrationWave.id));

  const categories = await db
    .select()
    .from(table.santriCategory)
    .orderBy(asc(table.santriCategory.sortOrder), asc(table.santriCategory.id));

  const waveId = Number(url.searchParams.get("wave")) || null;
  const categoryId = Number(url.searchParams.get("category")) || null;

  let plan: table.FeePlan | null = null;
  let items: table.FeePlanItem[] = [];

  if (waveId && categoryId) {
    const [found] = await db
      .select()
      .from(table.feePlan)
      .where(
        and(eq(table.feePlan.waveId, waveId), eq(table.feePlan.categoryId, categoryId))
      );
    plan = found ?? null;

    if (plan) {
      items = await db
        .select()
        .from(table.feePlanItem)
        .where(eq(table.feePlanItem.feePlanId, plan.id))
        .orderBy(asc(table.feePlanItem.sortOrder), asc(table.feePlanItem.createdAt));
    }
  }

  const total = items
    .filter((item) => item.isMandatory)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return { waves, categories, waveId, categoryId, plan, items, total };
};

function parseAmount(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").replace(/\./g, "").replace(",", ".").trim();
  if (!raw) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export const actions: Actions = {
  createPlan: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const waveId = Number(formData.get("waveId"));
    const categoryId = Number(formData.get("categoryId"));

    if (!waveId || !categoryId) {
      return fail(400, { message: "Pilih gelombang dan kategori terlebih dahulu." });
    }

    const [wave] = await db
      .select()
      .from(table.registrationWave)
      .where(eq(table.registrationWave.id, waveId));
    const [category] = await db
      .select()
      .from(table.santriCategory)
      .where(eq(table.santriCategory.id, categoryId));

    if (!wave || !category) {
      return fail(400, { message: "Gelombang atau kategori tidak ditemukan." });
    }

    await db
      .insert(table.feePlan)
      .values({
        waveId,
        categoryId,
        name: `Biaya ${category.name} · ${wave.academicYear}`
      })
      .onConflictDoNothing({
        target: [table.feePlan.waveId, table.feePlan.categoryId]
      });

    await logAudit({
      userId: locals.user?.id,
      action: "fee_plan.create",
      entityType: "fee_plan",
      entityId: `${waveId}:${categoryId}`,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Paket biaya dibuat. Tambahkan rincian komponen di bawah." };
  },

  addItem: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const feePlanId = String(formData.get("feePlanId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const amount = parseAmount(formData.get("amount"));
    const scope = String(formData.get("scope") ?? "pondok");
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    if (!feePlanId || !name || amount === null) {
      return fail(400, { message: "Nama komponen dan nominal wajib diisi dengan benar." });
    }

    if (scope !== "pondok" && scope !== "sekolah") {
      return fail(400, { message: "Cakupan biaya tidak valid." });
    }

    await db.insert(table.feePlanItem).values({
      feePlanId,
      name,
      amount,
      scope,
      isMandatory: formData.get("isMandatory") === "on",
      isRecurring: formData.get("isRecurring") === "on",
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
    });

    await logAudit({
      userId: locals.user?.id,
      action: "fee_plan_item.create",
      entityType: "fee_plan_item",
      entityId: feePlanId,
      metadata: { name, amount },
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Komponen "${name}" ditambahkan.` };
  },

  updateItem: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const amount = parseAmount(formData.get("amount"));
    const scope = String(formData.get("scope") ?? "pondok");
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    if (!id || !name || amount === null) {
      return fail(400, { message: "Data komponen tidak lengkap." });
    }

    await db
      .update(table.feePlanItem)
      .set({
        name,
        amount,
        scope: scope === "sekolah" ? "sekolah" : "pondok",
        isMandatory: formData.get("isMandatory") === "on",
        isRecurring: formData.get("isRecurring") === "on",
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
      })
      .where(eq(table.feePlanItem.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: "fee_plan_item.update",
      entityType: "fee_plan_item",
      entityId: id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Komponen "${name}" diperbarui.` };
  },

  deleteItem: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");

    if (!id) return fail(400, { message: "Komponen tidak ditemukan." });

    await db.delete(table.feePlanItem).where(eq(table.feePlanItem.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: "fee_plan_item.delete",
      entityType: "fee_plan_item",
      entityId: id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Komponen dihapus." };
  }
};
