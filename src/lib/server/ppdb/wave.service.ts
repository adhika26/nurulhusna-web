import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

export type Wave = table.RegistrationWave;

export function isWithinSchedule(wave: Wave, now = new Date()): boolean {
  return (
    (!wave.opensAt || wave.opensAt.getTime() <= now.getTime()) &&
    (!wave.closesAt || wave.closesAt.getTime() >= now.getTime())
  );
}

/** Mode uji coba: buka pendaftaran meski di luar jadwal gelombang. */
export async function isForceOpenEnabled(): Promise<boolean> {
  const [row] = await db
    .select({ value: table.setting.value })
    .from(table.setting)
    .where(eq(table.setting.key, "ppdb_force_open"));

  return row?.value === "1";
}

async function getUpcomingActiveWave(now: Date): Promise<Wave | null> {
  const [upcoming] = await db
    .select()
    .from(table.registrationWave)
    .where(
      and(
        eq(table.registrationWave.isActive, true),
        gt(table.registrationWave.opensAt, now)
      )
    )
    .orderBy(asc(table.registrationWave.opensAt))
    .limit(1);

  return upcoming ?? null;
}

/**
 * Gelombang yang sedang dibuka berdasarkan tanggal.
 * Jika ada lebih dari satu yang tumpang tindih, dipilih yang paling baru dibuka.
 * Saat mode uji coba aktif dan tidak ada gelombang dalam jadwal, dipakai
 * gelombang aktif terdekat agar pendaftaran tetap bisa dicoba.
 */
export async function getOpenWave(now = new Date()): Promise<Wave | null> {
  const waves = await db
    .select()
    .from(table.registrationWave)
    .where(eq(table.registrationWave.isActive, true))
    .orderBy(asc(table.registrationWave.opensAt));

  const open = waves.filter((wave) => isWithinSchedule(wave, now));

  if (open.length > 0) return open[open.length - 1];

  if (!(await isForceOpenEnabled())) return null;

  const upcoming = await getUpcomingActiveWave(now);
  if (upcoming) return upcoming;

  return waves.length > 0 ? waves[waves.length - 1] : null;
}

export async function getUpcomingWave(now = new Date()): Promise<Wave | null> {
  return getUpcomingActiveWave(now);
}

export function waveState(
  wave: Wave,
  now = new Date()
): "dibuka" | "akan datang" | "ditutup" | "nonaktif" {
  if (!wave.isActive) return "nonaktif";
  if (wave.opensAt && now.getTime() < wave.opensAt.getTime()) return "akan datang";
  if (wave.closesAt && now.getTime() > wave.closesAt.getTime()) return "ditutup";
  return "dibuka";
}
