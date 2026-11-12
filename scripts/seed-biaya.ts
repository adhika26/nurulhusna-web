/**
 * Seed kategori dan rincian biaya sesuai PDF Yayasan Nurul Chusna 2025-2026.
 * Jalankan: npm run db:seed-biaya
 */
import { and, eq } from "drizzle-orm";
import { db, client } from "../src/lib/server/db";
import * as table from "../src/lib/server/db/schema";

type FeeItem = {
  name: string;
  amount: number;
  scope: "pondok" | "sekolah";
  isRecurring?: boolean;
};

const miPondok: FeeItem[] = [
  { name: "Uang Pangkal Pondok", amount: 620_000, scope: "pondok" },
  { name: "Rapot", amount: 35_000, scope: "pondok" },
  { name: "Infaq Madin", amount: 30_000, scope: "pondok" },
  { name: "Kitab Madin", amount: 30_000, scope: "pondok" },
  { name: "Bulanan Madin (Semester I)", amount: 100_000, scope: "pondok" },
  { name: "Kos Makan 3x", amount: 350_000, scope: "pondok", isRecurring: true },
  { name: "Pemondokan", amount: 130_000, scope: "pondok", isRecurring: true },
  { name: "Jas Almamater", amount: 200_000, scope: "pondok" },
  { name: "Peci/Jilbab", amount: 60_000, scope: "pondok" },
  { name: "Seragam", amount: 300_000, scope: "pondok" },
  { name: "Al-Qur'an", amount: 60_000, scope: "pondok" },
  { name: "Yanbu'a", amount: 50_000, scope: "pondok" },
  { name: "Buku Absen Ngaji", amount: 5_000, scope: "pondok" },
  { name: "Buku Izin", amount: 10_000, scope: "pondok" },
  { name: "Majmu'", amount: 80_000, scope: "pondok" }
];

const mtsPondok: FeeItem[] = miPondok.map((item) =>
  item.name === "Kitab Madin" ? { ...item, amount: 80_000 } : item
);

const miSchool = (lks: number): FeeItem[] => [
  { name: "Identitas", amount: 100_000, scope: "sekolah" },
  { name: "Kaos Olahraga", amount: 140_000, scope: "sekolah" },
  { name: "Pengembangan Madrasah", amount: 250_000, scope: "sekolah" },
  { name: "Belanja Rutin Tahunan", amount: 275_000, scope: "sekolah" },
  { name: "I'anah", amount: 50_000, scope: "sekolah" },
  { name: "Sampul Rapor", amount: 50_000, scope: "sekolah" },
  { name: "ATK (Alat Tulis Kantor)", amount: 75_000, scope: "sekolah" },
  { name: "LKS 1 Tahun", amount: lks, scope: "sekolah" }
];

const mtsSchool = (gender: "male" | "female"): FeeItem[] => [
  { name: "Osis", amount: 200_000, scope: "sekolah" },
  { name: "Pramuka", amount: 200_000, scope: "sekolah" },
  { name: "Identitas", amount: 200_000, scope: "sekolah" },
  { name: "Kaos Olahraga", amount: 100_000, scope: "sekolah" },
  { name: "Hasduk", amount: 15_000, scope: "sekolah" },
  { name: "Topi (Osis, Pramuka)", amount: 40_000, scope: "sekolah" },
  { name: "Ikat Pinggang", amount: 25_000, scope: "sekolah" },
  { name: "Dasi", amount: 15_000, scope: "sekolah" },
  { name: "Pengembangan Madrasah", amount: 350_000, scope: "sekolah" },
  gender === "male"
    ? { name: "Peci", amount: 50_000, scope: "sekolah" }
    : { name: "Jilbab (Osis, Pramuka, Identitas)", amount: 150_000, scope: "sekolah" },
  { name: "Belanja Rutin Tahunan", amount: 350_000, scope: "sekolah" },
  { name: "Sumbangan Buku Perpustakaan", amount: 200_000, scope: "sekolah" },
  { name: "I'anah", amount: 150_000, scope: "sekolah" },
  { name: "Sampul Rapor", amount: 50_000, scope: "sekolah" },
  { name: "Buku Pendamping Pembelajaran", amount: 300_000, scope: "sekolah" }
];

const categories = [
  {
    code: "MI13",
    name: "Mondok + MI 1-3",
    institutionName: "MI Nurul Chusna",
    educationLevel: "mi" as const,
    gradeRange: "1-3",
    description: "Santri mukim di pondok dan menempuh pendidikan formal MI kelas 1-3.",
    sortOrder: 1,
    items: [...miPondok, ...miSchool(200_000)]
  },
  {
    code: "MI46",
    name: "Mondok + MI 4-6",
    institutionName: "MI Nurul Chusna",
    educationLevel: "mi" as const,
    gradeRange: "4-6",
    description: "Santri mukim di pondok dan menempuh pendidikan formal MI kelas 4-6.",
    sortOrder: 2,
    items: [...miPondok, ...miSchool(225_000)]
  },
  {
    code: "MTS_PA",
    name: "Mondok + MTs Putra",
    institutionName: "MTs. Nurul Chusna",
    educationLevel: "mts" as const,
    gradeRange: "7-9",
    description: "Santri putra mukim di pondok dan menempuh pendidikan formal MTs.",
    sortOrder: 3,
    items: [...mtsPondok, ...mtsSchool("male")]
  },
  {
    code: "MTS_PI",
    name: "Mondok + MTs Putri",
    institutionName: "MTs. Nurul Chusna",
    educationLevel: "mts" as const,
    gradeRange: "7-9",
    description: "Santri putri mukim di pondok dan menempuh pendidikan formal MTs.",
    sortOrder: 4,
    items: [...mtsPondok, ...mtsSchool("female")]
  },
  {
    code: "MONDOK",
    name: "Mondok Saja",
    institutionName: "Pondok Pesantren Nurul Husna",
    educationLevel: "none" as const,
    gradeRange: null,
    description: "Santri mukim di pondok tanpa menempuh pendidikan formal di yayasan.",
    sortOrder: 5,
    items: miPondok
  }
];

async function main() {
  const waves = await db.select().from(table.registrationWave);

  for (const category of categories) {
    const [row] = await db
      .insert(table.santriCategory)
      .values({
        code: category.code,
        name: category.name,
        institutionName: category.institutionName,
        educationLevel: category.educationLevel,
        gradeRange: category.gradeRange,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true
      })
      .onConflictDoUpdate({
        target: table.santriCategory.code,
        set: {
          name: category.name,
          institutionName: category.institutionName,
          educationLevel: category.educationLevel,
          gradeRange: category.gradeRange,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: true,
          updatedAt: new Date()
        }
      })
      .returning();

    for (const wave of waves) {
      const [plan] = await db
        .insert(table.feePlan)
        .values({
          waveId: wave.id,
          categoryId: row.id,
          name: `Biaya ${category.name} - ${wave.academicYear}`,
          isActive: true
        })
        .onConflictDoUpdate({
          target: [table.feePlan.waveId, table.feePlan.categoryId],
          set: {
            name: `Biaya ${category.name} - ${wave.academicYear}`,
            isActive: true,
            updatedAt: new Date()
          }
        })
        .returning();

      await db.delete(table.feePlanItem).where(eq(table.feePlanItem.feePlanId, plan.id));

      await db.insert(table.feePlanItem).values(
        category.items.map((item, index) => ({
          feePlanId: plan.id,
          name: item.name,
          amount: item.amount,
          scope: item.scope,
          isMandatory: true,
          isRecurring: item.isRecurring ?? false,
          sortOrder: index + 1
        }))
      );

      const total = category.items.reduce((sum, item) => sum + item.amount, 0);
      console.log(
        `${category.code} ${wave.academicYear}: ${category.items.length} komponen, total ${total.toLocaleString("id-ID")}`
      );
    }
  }

  await db
    .update(table.santriCategory)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(table.santriCategory.code, "MTS"), eq(table.santriCategory.isActive, true)));

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
