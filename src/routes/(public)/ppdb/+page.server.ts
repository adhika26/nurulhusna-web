import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { getSettingMap } from "$lib/server/services/setting.service";
import { getOpenWave, getUpcomingWave, isForceOpenEnabled, isWithinSchedule } from "$lib/server/ppdb/wave.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const wave = await getOpenWave();
  const upcoming = wave ? null : await getUpcomingWave();
  const forced = wave ? (await isForceOpenEnabled()) && !isWithinSchedule(wave) : false;

  const categories = await db
    .select()
    .from(table.santriCategory)
    .where(eq(table.santriCategory.isActive, true))
    .orderBy(asc(table.santriCategory.sortOrder), asc(table.santriCategory.id));

  let plans: table.FeePlan[] = [];
  let items: table.FeePlanItem[] = [];

  if (wave) {
    plans = await db
      .select()
      .from(table.feePlan)
      .where(and(eq(table.feePlan.waveId, wave.id), eq(table.feePlan.isActive, true)));

    if (plans.length > 0) {
      items = await db
        .select()
        .from(table.feePlanItem)
        .where(
          inArray(
            table.feePlanItem.feePlanId,
            plans.map((plan) => plan.id)
          )
        );
    }
  }

  const totals: Record<number, number | null> = {};

  for (const category of categories) {
    const plan = plans.find((item) => item.categoryId === category.id);
    if (!plan) {
      totals[category.id] = null;
      continue;
    }

    totals[category.id] = items
      .filter((item) => item.feePlanId === plan.id && item.isMandatory)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  }

  const settings = await getSettingMap();

  return {
    wave: wave
      ? {
          name: wave.name,
          code: wave.code,
          academicYear: wave.academicYear,
          opensAt: wave.opensAt,
          closesAt: wave.closesAt
        }
      : null,
    forced,
    upcoming: upcoming
      ? {
          name: upcoming.name,
          academicYear: upcoming.academicYear,
          opensAt: upcoming.opensAt,
          closesAt: upcoming.closesAt
        }
      : null,
    categories: categories.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
      institutionName: category.institutionName,
      educationLevel: category.educationLevel,
      gradeRange: category.gradeRange,
      description: category.description
    })),
    totals,
    intro: settings.ppdb_intro ?? ""
  };
};
