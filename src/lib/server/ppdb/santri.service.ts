import { and, eq, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { CHECKLIST_ITEMS } from "$lib/types/registration";

export type SyncSantriResult = {
  created: boolean;
  santriId: string | null;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Versi transaksi dari pembuatan santri. */
export async function syncSantriTx(
  tx: Tx,
  registrationId: string
): Promise<SyncSantriResult> {
  const [registration] = await tx
    .select()
    .from(table.registration)
    .where(eq(table.registration.id, registrationId));

  if (!registration || registration.status === "rejected") {
    return { created: false, santriId: null };
  }

  const [existing] = await tx
    .select({ id: table.santri.id })
    .from(table.santri)
    .where(eq(table.santri.registrationId, registrationId));

  if (existing) return { created: false, santriId: existing.id };

  const [invoice] = await tx
    .select()
    .from(table.invoice)
    .where(eq(table.invoice.registrationId, registrationId));

  if (!invoice) {
    return { created: false, santriId: null };
  }

  const [firstInstallment] = await tx
    .select()
    .from(table.installment)
    .where(
      and(
        eq(table.installment.invoiceId, invoice.id),
        eq(table.installment.sequence, 1)
      )
    );

  if (!firstInstallment || firstInstallment.status !== "paid") {
    return { created: false, santriId: null };
  }

  if (!registration.documentsVerifiedAt) {
    return { created: false, santriId: null };
  }

  const checklist = await tx
    .select()
    .from(table.registrationChecklist)
    .where(eq(table.registrationChecklist.registrationId, registrationId));

  const missingRequired = CHECKLIST_ITEMS.filter(
    (item) =>
      item.required &&
      !checklist.some((row) => row.itemKey === item.key && row.isChecked)
  );

  if (missingRequired.length > 0) {
    return { created: false, santriId: null };
  }

  const now = new Date();

  const [created] = await tx
    .insert(table.santri)
    .values({
      registrationId: registration.id,
      categoryId: registration.categoryId,
      waveId: registration.waveId,
      nis: null,
      fullName: registration.fullName,
      gender: registration.gender,
      status: "active",
      joinedAt: now
    })
    .onConflictDoNothing({ target: table.santri.registrationId })
    .returning({ id: table.santri.id });

  if (!created) return { created: false, santriId: null };

  await tx
    .update(table.registration)
    .set({
      status: "enrolled",
      enrolledAt: now,
      updatedAt: now
    })
    .where(eq(table.registration.id, registrationId));

  return { created: true, santriId: created.id };
}

export async function syncSantriFromRegistration(
  registrationId: string
): Promise<SyncSantriResult> {
  return db.transaction((tx) => syncSantriTx(tx, registrationId));
}

export async function syncSantriFromInvoiceTx(
  tx: Tx,
  invoiceId: string
): Promise<SyncSantriResult> {
  const [invoice] = await tx
    .select({ registrationId: table.invoice.registrationId })
    .from(table.invoice)
    .where(eq(table.invoice.id, invoiceId));

  if (!invoice) return { created: false, santriId: null };

  return syncSantriTx(tx, invoice.registrationId);
}

export async function syncSantriFromInvoice(invoiceId: string): Promise<SyncSantriResult> {
  return db.transaction((tx) => syncSantriFromInvoiceTx(tx, invoiceId));
}

type AssignPlacementInput = {
  santriId: string;
  roomId: number;
  lockerId: number | null;
  notes?: string | null;
};

export async function assignSantriPlacement(input: AssignPlacementInput): Promise<void> {
  const [row] = await db
    .select({
      santri: table.santri,
      room: table.room,
      buildingGender: table.building.gender
    })
    .from(table.santri)
    .innerJoin(table.room, eq(table.room.id, input.roomId))
    .innerJoin(table.building, eq(table.building.id, table.room.buildingId))
    .where(eq(table.santri.id, input.santriId));

  if (!row) throw new Error("Santri atau kamar tidak ditemukan.");
  if (row.buildingGender !== row.santri.gender) {
    throw new Error("Kamar tidak sesuai dengan jenis kelamin santri.");
  }

  if (row.room.capacity > 0) {
    const [current] = await db
      .select({ roomId: table.santriPlacement.roomId })
      .from(table.santriPlacement)
      .where(
        and(
          eq(table.santriPlacement.santriId, input.santriId),
          isNull(table.santriPlacement.endedAt)
        )
      );

    const occupants = await db
      .select({ id: table.santriPlacement.id })
      .from(table.santriPlacement)
      .where(
        and(eq(table.santriPlacement.roomId, input.roomId), isNull(table.santriPlacement.endedAt))
      );

    if (current?.roomId !== input.roomId && occupants.length >= row.room.capacity) {
      throw new Error("Kamar sudah penuh.");
    }
  }

  if (input.lockerId) {
    const [lockerRow] = await db
      .select()
      .from(table.locker)
      .where(eq(table.locker.id, input.lockerId));

    if (!lockerRow || lockerRow.roomId !== input.roomId) {
      throw new Error("Loker tidak berada di kamar yang dipilih.");
    }

    const [used] = await db
      .select({ santriId: table.santriPlacement.santriId })
      .from(table.santriPlacement)
      .where(
        and(
          eq(table.santriPlacement.lockerId, input.lockerId),
          isNull(table.santriPlacement.endedAt)
        )
      );

    if (used && used.santriId !== input.santriId) {
      throw new Error("Loker sudah dipakai santri lain.");
    }
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(table.santriPlacement)
      .set({ endedAt: now })
      .where(
        and(
          eq(table.santriPlacement.santriId, input.santriId),
          isNull(table.santriPlacement.endedAt)
        )
      );

    await tx.insert(table.santriPlacement).values({
      santriId: input.santriId,
      roomId: input.roomId,
      lockerId: input.lockerId,
      notes: input.notes || null,
      startedAt: now
    });
  });
}
