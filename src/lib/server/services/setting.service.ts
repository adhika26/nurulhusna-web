import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

export async function getSettingMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(table.setting);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const [row] = await db.select().from(table.setting).where(eq(table.setting.key, key));
  return row?.value ?? fallback;
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    await db
      .insert(table.setting)
      .values({ key, value })
      .onConflictDoUpdate({
        target: table.setting.key,
        set: { value, updatedAt: new Date() }
      });
  }
}
