import { fail } from "@sveltejs/kit";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { canManageAsrama } from "$lib/server/roles";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const buildings = await db
    .select()
    .from(table.building)
    .orderBy(asc(table.building.name));
  const rooms = await db.select().from(table.room).orderBy(asc(table.room.name));
  const lockers = await db.select().from(table.locker).orderBy(asc(table.locker.code));

  const placements = await db
    .select({
      roomId: table.santriPlacement.roomId,
      lockerId: table.santriPlacement.lockerId
    })
    .from(table.santriPlacement)
    .where(isNull(table.santriPlacement.endedAt));

  const roomOccupancy = new Map<number, number>();
  const lockerUsage = new Map<number, number>();

  for (const placement of placements) {
    roomOccupancy.set(placement.roomId, (roomOccupancy.get(placement.roomId) ?? 0) + 1);
    if (placement.lockerId) {
      lockerUsage.set(placement.lockerId, (lockerUsage.get(placement.lockerId) ?? 0) + 1);
    }
  }

  return {
    buildings: buildings.map((building) => {
      const buildingRooms = rooms
        .filter((room) => room.buildingId === building.id)
        .map((room) => ({
          ...room,
          occupants: roomOccupancy.get(room.id) ?? 0,
          lockers: lockers
            .filter((locker) => locker.roomId === room.id)
            .map((locker) => ({ ...locker, occupied: (lockerUsage.get(locker.id) ?? 0) > 0 }))
        }));

      return {
        ...building,
        rooms: buildingRooms,
        roomCount: buildingRooms.length,
        lockerCount: buildingRooms.reduce((sum, room) => sum + room.lockers.length, 0)
      };
    }),
    stats: {
      buildings: buildings.length,
      rooms: rooms.length,
      lockers: lockers.length,
      occupants: placements.length
    },
    canManage: canManageAsrama(locals.user?.role)
  };
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export const actions: Actions = {
  createBuilding: async ({ request, locals, getClientAddress }) => {
    if (!canManageAsrama(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data asrama." });
    }

    const formData = await request.formData();
    const code = text(formData, "code").toUpperCase();
    const name = text(formData, "name");
    const gender = text(formData, "gender");
    const notes = text(formData, "notes");

    if (!code || !name || (gender !== "male" && gender !== "female")) {
      return fail(400, { message: "Kode, nama, dan jenis kelamin gedung wajib diisi." });
    }

    try {
      await db.insert(table.building).values({ code, name, gender, notes: notes || null });
    } catch {
      return fail(400, { message: "Kode gedung sudah dipakai." });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "building.create",
      entityType: "building",
      entityId: code,
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Gedung "${name}" ditambahkan.` };
  },

  updateBuilding: async ({ request, locals }) => {
    if (!canManageAsrama(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data asrama." });
    }

    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const name = text(formData, "name");
    const gender = text(formData, "gender");
    const notes = text(formData, "notes");
    const isActive = formData.get("isActive") === "on";

    if (!id || !name || (gender !== "male" && gender !== "female")) {
      return fail(400, { message: "Nama dan jenis kelamin gedung wajib diisi." });
    }

    await db
      .update(table.building)
      .set({ name, gender, notes: notes || null, isActive, updatedAt: new Date() })
      .where(eq(table.building.id, id));

    return { success: true, message: "Gedung diperbarui." };
  },

  createRoom: async ({ request, locals }) => {
    if (!canManageAsrama(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data asrama." });
    }

    const formData = await request.formData();
    const buildingId = Number(formData.get("buildingId"));
    const name = text(formData, "name");
    const capacity = Number(formData.get("capacity") ?? 0);
    const notes = text(formData, "notes");

    if (!buildingId || !name) {
      return fail(400, { message: "Gedung dan nama kamar wajib diisi." });
    }

    try {
      await db.insert(table.room).values({
        buildingId,
        name,
        capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 0,
        notes: notes || null
      });
    } catch {
      return fail(400, { message: "Nama kamar sudah ada di gedung ini." });
    }

    return { success: true, message: `Kamar "${name}" ditambahkan.` };
  },

  updateRoom: async ({ request, locals }) => {
    if (!canManageAsrama(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data asrama." });
    }

    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const name = text(formData, "name");
    const capacity = Number(formData.get("capacity") ?? 0);
    const notes = text(formData, "notes");
    const isActive = formData.get("isActive") === "on";

    if (!id || !name) return fail(400, { message: "Nama kamar wajib diisi." });

    await db
      .update(table.room)
      .set({
        name,
        capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 0,
        notes: notes || null,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(table.room.id, id));

    return { success: true, message: "Kamar diperbarui." };
  },

  createLocker: async ({ request, locals }) => {
    if (!canManageAsrama(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data asrama." });
    }

    const formData = await request.formData();
    const roomId = Number(formData.get("roomId"));
    const code = text(formData, "code");
    const notes = text(formData, "notes");

    if (!roomId || !code) return fail(400, { message: "Kamar dan nomor loker wajib diisi." });

    try {
      await db.insert(table.locker).values({ roomId, code, notes: notes || null });
    } catch {
      return fail(400, { message: "Nomor loker sudah ada di kamar ini." });
    }

    return { success: true, message: `Loker "${code}" ditambahkan.` };
  },

  updateLocker: async ({ request, locals }) => {
    if (!canManageAsrama(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data asrama." });
    }

    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const code = text(formData, "code");
    const notes = text(formData, "notes");
    const isActive = formData.get("isActive") === "on";

    if (!id || !code) return fail(400, { message: "Nomor loker wajib diisi." });

    await db
      .update(table.locker)
      .set({ code, notes: notes || null, isActive, updatedAt: new Date() })
      .where(eq(table.locker.id, id));

    return { success: true, message: "Loker diperbarui." };
  },

  deleteLocker: async ({ request, locals }) => {
    if (!canManageAsrama(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah data asrama." });
    }

    const formData = await request.formData();
    const id = Number(formData.get("id"));

    if (!id) return fail(400, { message: "Loker tidak ditemukan." });

    const [used] = await db
      .select({ id: table.santriPlacement.id })
      .from(table.santriPlacement)
      .where(
        and(eq(table.santriPlacement.lockerId, id), isNull(table.santriPlacement.endedAt))
      );

    if (used) return fail(400, { message: "Loker sedang dipakai santri." });

    await db.delete(table.locker).where(eq(table.locker.id, id));

    return { success: true, message: "Loker dihapus." };
  }
};
