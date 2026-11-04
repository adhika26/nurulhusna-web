import { fail } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

const levels = new Set(["mi", "mts", "none"]);

export const load: PageServerLoad = async () => {
  const categories = await db
    .select()
    .from(table.santriCategory)
    .orderBy(asc(table.santriCategory.sortOrder), asc(table.santriCategory.id));

  return { categories };
};

export const actions: Actions = {
  update: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();
    const institutionName = String(formData.get("institutionName") ?? "").trim();
    const educationLevel = String(formData.get("educationLevel") ?? "none");
    const gradeRange = String(formData.get("gradeRange") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    const isActive = formData.get("isActive") === "on";

    if (!id || !name || !institutionName) {
      return fail(400, { message: "Nama kategori dan nama lembaga wajib diisi." });
    }

    if (!levels.has(educationLevel)) {
      return fail(400, { message: "Jenjang pendidikan tidak valid." });
    }

    await db
      .update(table.santriCategory)
      .set({
        name,
        institutionName,
        educationLevel: educationLevel as "mi" | "mts" | "none",
        gradeRange: gradeRange || null,
        description: description || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(table.santriCategory.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: "category.update",
      entityType: "santri_category",
      entityId: String(id),
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Kategori "${name}" diperbarui.` };
  }
};
