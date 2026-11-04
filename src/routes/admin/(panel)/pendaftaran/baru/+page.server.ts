import { and, asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { getOpenWave } from "$lib/server/ppdb/wave.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const categories = await db
    .select()
    .from(table.santriCategory)
    .where(eq(table.santriCategory.isActive, true))
    .orderBy(asc(table.santriCategory.sortOrder), asc(table.santriCategory.id));

  const mappedCategories = categories.map((category) => ({
    code: category.code,
    name: category.name,
    institutionName: category.institutionName,
    gradeRange: category.gradeRange,
    educationLevel: category.educationLevel
  }));

  const wave = await getOpenWave();

  if (!wave) {
    return {
      wave: null,
      categories: mappedCategories,
      category: null,
      total: 0
    };
  }

  const code = (url.searchParams.get("kategori") ?? "").trim().toUpperCase();
  const selected = categories.find((category) => category.code === code) ?? null;

  if (!selected) {
    return {
      wave: { name: wave.name, academicYear: wave.academicYear },
      categories: mappedCategories,
      category: null,
      total: 0
    };
  }

  const [plan] = await db
    .select()
    .from(table.feePlan)
    .where(
      and(
        eq(table.feePlan.waveId, wave.id),
        eq(table.feePlan.categoryId, selected.id),
        eq(table.feePlan.isActive, true)
      )
    );

  const items = plan
    ? await db
        .select()
        .from(table.feePlanItem)
        .where(eq(table.feePlanItem.feePlanId, plan.id))
    : [];

  const total = items
    .filter((item) => item.isMandatory)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    wave: { name: wave.name, academicYear: wave.academicYear },
    categories: mappedCategories,
    category: {
      code: selected.code,
      name: selected.name,
      institutionName: selected.institutionName
    },
    total
  };
};
