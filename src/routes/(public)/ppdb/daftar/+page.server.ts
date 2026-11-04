import { error, redirect } from "@sveltejs/kit";
import { and, asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { getOpenWave } from "$lib/server/ppdb/wave.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const code = (url.searchParams.get("kategori") ?? "").trim().toUpperCase();

  if (!code) redirect(303, "/ppdb");

  const [category] = await db
    .select()
    .from(table.santriCategory)
    .where(eq(table.santriCategory.code, code));

  if (!category || !category.isActive) error(404, "Kategori santri tidak ditemukan.");

  const wave = await getOpenWave();

  if (!wave) redirect(303, "/ppdb");

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
    ? await db
        .select()
        .from(table.feePlanItem)
        .where(eq(table.feePlanItem.feePlanId, plan.id))
        .orderBy(asc(table.feePlanItem.sortOrder), asc(table.feePlanItem.createdAt))
    : [];

  const total = items
    .filter((item) => item.isMandatory)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    category: {
      code: category.code,
      name: category.name,
      institutionName: category.institutionName
    },
    academicYear: wave.academicYear,
    waveName: wave.name,
    total,
    items: items.map((item) => ({
      name: item.name,
      amount: Number(item.amount),
      scope: item.scope,
      isMandatory: item.isMandatory
    }))
  };
};
