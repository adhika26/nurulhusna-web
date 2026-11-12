import { and, asc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { canManageSantri } from "$lib/server/roles";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = url.searchParams.get("status") ?? "";

  const conditions = [];

  if (q) {
    conditions.push(or(ilike(table.santri.fullName, `%${q}%`), ilike(table.santri.nis, `%${q}%`)));
  }

  if (status === "active" || status === "graduated" || status === "left") {
    conditions.push(eq(table.santri.status, status));
  }

  const rows = await db
    .select({
      santri: table.santri,
      category: { name: table.santriCategory.name },
      wave: { academicYear: table.registrationWave.academicYear },
      registration: { code: table.registration.code },
      placement: {
        id: table.santriPlacement.id,
        startedAt: table.santriPlacement.startedAt
      },
      room: { name: table.room.name },
      building: { name: table.building.name, gender: table.building.gender },
      locker: { code: table.locker.code }
    })
    .from(table.santri)
    .innerJoin(table.santriCategory, eq(table.santri.categoryId, table.santriCategory.id))
    .innerJoin(table.registrationWave, eq(table.santri.waveId, table.registrationWave.id))
    .innerJoin(table.registration, eq(table.santri.registrationId, table.registration.id))
    .leftJoin(
      table.santriPlacement,
      and(
        eq(table.santriPlacement.santriId, table.santri.id),
        isNull(table.santriPlacement.endedAt)
      )
    )
    .leftJoin(table.room, eq(table.room.id, table.santriPlacement.roomId))
    .leftJoin(table.building, eq(table.building.id, table.room.buildingId))
    .leftJoin(table.locker, eq(table.locker.id, table.santriPlacement.lockerId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(table.santri.fullName));

  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${table.santri.status} = 'active')::int`,
      male: sql<number>`count(*) filter (where ${table.santri.gender} = 'male')::int`,
      female: sql<number>`count(*) filter (where ${table.santri.gender} = 'female')::int`
    })
    .from(table.santri);

  return {
    santri: rows.map((row) => ({
      id: row.santri.id,
      nis: row.santri.nis,
      fullName: row.santri.fullName,
      gender: row.santri.gender,
      status: row.santri.status,
      joinedAt: row.santri.joinedAt,
      categoryName: row.category.name,
      academicYear: row.wave.academicYear,
      registrationCode: row.registration.code,
      roomName: row.room?.name ?? null,
      buildingName: row.building?.name ?? null,
      lockerCode: row.locker?.code ?? null,
      hasPlacement: row.placement !== null
    })),
    counts: counts ?? { total: 0, active: 0, male: 0, female: 0 },
    filters: { q, status },
    canManage: canManageSantri(locals.user?.role)
  };
};
