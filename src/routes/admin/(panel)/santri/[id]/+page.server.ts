import { error, fail } from "@sveltejs/kit";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { canManageSantri } from "$lib/server/roles";
import { assignSantriPlacement } from "$lib/server/ppdb/santri.service";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const [row] = await db
    .select({
      santri: table.santri,
      registration: {
        code: table.registration.code,
        phone: table.registration.phone,
        status: table.registration.status
      },
      category: { name: table.santriCategory.name },
      wave: { academicYear: table.registrationWave.academicYear }
    })
    .from(table.santri)
    .innerJoin(table.registration, eq(table.santri.registrationId, table.registration.id))
    .innerJoin(table.santriCategory, eq(table.santri.categoryId, table.santriCategory.id))
    .innerJoin(table.registrationWave, eq(table.santri.waveId, table.registrationWave.id))
    .where(eq(table.santri.id, params.id));

  if (!row) error(404, "Data santri tidak ditemukan.");

  const history = await db
    .select({
      id: table.santriPlacement.id,
      roomId: table.santriPlacement.roomId,
      lockerId: table.santriPlacement.lockerId,
      startedAt: table.santriPlacement.startedAt,
      endedAt: table.santriPlacement.endedAt,
      notes: table.santriPlacement.notes,
      roomName: table.room.name,
      buildingName: table.building.name,
      lockerCode: table.locker.code
    })
    .from(table.santriPlacement)
    .innerJoin(table.room, eq(table.room.id, table.santriPlacement.roomId))
    .innerJoin(table.building, eq(table.building.id, table.room.buildingId))
    .leftJoin(table.locker, eq(table.locker.id, table.santriPlacement.lockerId))
    .where(eq(table.santriPlacement.santriId, row.santri.id))
    .orderBy(desc(table.santriPlacement.startedAt));

  const current = history.find((item) => item.endedAt === null) ?? null;

  const buildings = await db
    .select()
    .from(table.building)
    .where(and(eq(table.building.gender, row.santri.gender), eq(table.building.isActive, true)))
    .orderBy(asc(table.building.name));

  const rooms = await db
    .select()
    .from(table.room)
    .where(eq(table.room.isActive, true))
    .orderBy(asc(table.room.name));

  const lockers = await db
    .select()
    .from(table.locker)
    .where(eq(table.locker.isActive, true))
    .orderBy(asc(table.locker.code));

  const availableRooms = buildings.flatMap((building) =>
    rooms
      .filter((room) => room.buildingId === building.id)
      .map((room) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        buildingName: building.name,
        lockers: lockers
          .filter((locker) => locker.roomId === room.id)
          .map((locker) => ({ id: locker.id, code: locker.code }))
      }))
  );

  return {
    santri: row.santri,
    registration: row.registration,
    categoryName: row.category.name,
    academicYear: row.wave.academicYear,
    currentPlacement: current,
    history,
    availableRooms,
    canManage: canManageSantri(locals.user?.role)
  };
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    if (!canManageSantri(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data santri." });
    }

    const formData = await request.formData();
    const nis = String(formData.get("nis") ?? "").trim();
    const status = String(formData.get("status") ?? "active");
    const notes = String(formData.get("notes") ?? "").trim();

    if (!["active", "graduated", "left"].includes(status)) {
      return fail(400, { message: "Status santri tidak valid." });
    }

    try {
      await db
        .update(table.santri)
        .set({
          nis: nis || null,
          status: status as "active" | "graduated" | "left",
          notes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(table.santri.id, params.id));

      if (status === "graduated" || status === "left") {
        await db
          .update(table.santriPlacement)
          .set({ endedAt: new Date() })
          .where(
            and(
              eq(table.santriPlacement.santriId, params.id),
              isNull(table.santriPlacement.endedAt)
            )
          );
      }
    } catch {
      return fail(400, { message: "NIS sudah dipakai santri lain." });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "santri.update",
      entityType: "santri",
      entityId: params.id
    });

    return { success: true, message: "Data santri diperbarui." };
  },

  assign: async ({ params, request, locals }) => {
    if (!canManageSantri(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak menempatkan santri." });
    }

    const formData = await request.formData();
    const roomId = Number(formData.get("roomId"));
    const lockerId = Number(formData.get("lockerId")) || null;
    const notes = String(formData.get("notes") ?? "").trim();

    if (!roomId) return fail(400, { message: "Pilih kamar terlebih dahulu." });

    try {
      await assignSantriPlacement({
        santriId: params.id,
        roomId,
        lockerId,
        notes: notes || null
      });
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal menempatkan santri."
      });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "santri.place",
      entityType: "santri",
      entityId: params.id,
      metadata: { roomId, lockerId }
    });

    return { success: true, message: "Penempatan santri disimpan." };
  },

  release: async ({ params, request, locals }) => {
    if (!canManageSantri(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah penempatan." });
    }

    const now = new Date();

    await db
      .update(table.santriPlacement)
      .set({ endedAt: now })
      .where(
        and(eq(table.santriPlacement.santriId, params.id), isNull(table.santriPlacement.endedAt))
      );

    await logAudit({
      userId: locals.user?.id,
      action: "santri.release",
      entityType: "santri",
      entityId: params.id
    });

    return { success: true, message: "Penempatan santri dilepas." };
  }
};
