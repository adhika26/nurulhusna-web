/**
 * Seed data master: kategori santri, gelombang, dan pengaturan dasar.
 * Jalankan: npm run db:seed
 */
import { and, eq } from "drizzle-orm";
import { db, client } from "../src/lib/server/db";
import * as table from "../src/lib/server/db/schema";

const categories = [
  {
    code: "MI13",
    name: "Mondok + MI 1-3",
    institutionName: "MI Nurul Chusna",
    educationLevel: "mi" as const,
    gradeRange: "1-3",
    description: "Santri mukim di pondok dan menempuh pendidikan formal MI kelas 1-3.",
    sortOrder: 1
  },
  {
    code: "MI46",
    name: "Mondok + MI 4-6",
    institutionName: "MI Nurul Chusna",
    educationLevel: "mi" as const,
    gradeRange: "4-6",
    description: "Santri mukim di pondok dan menempuh pendidikan formal MI kelas 4-6.",
    sortOrder: 2
  },
  {
    code: "MTS_PA",
    name: "Mondok + MTs Putra",
    institutionName: "MTs. Nurul Chusna",
    educationLevel: "mts" as const,
    gradeRange: "7-9",
    description: "Santri putra mukim di pondok dan menempuh pendidikan formal MTs.",
    sortOrder: 3
  },
  {
    code: "MTS_PI",
    name: "Mondok + MTs Putri",
    institutionName: "MTs. Nurul Chusna",
    educationLevel: "mts" as const,
    gradeRange: "7-9",
    description: "Santri putri mukim di pondok dan menempuh pendidikan formal MTs.",
    sortOrder: 4
  },
  {
    code: "MONDOK",
    name: "Mondok Saja",
    institutionName: "Pondok Pesantren Nurul Husna",
    educationLevel: "none" as const,
    gradeRange: null,
    description: "Santri mukim di pondok tanpa menempuh pendidikan formal di yayasan.",
    sortOrder: 5
  }
];

const settings = [
  { key: "site_name", value: "Pondok Pesantren Nurul Husna" },
  { key: "site_tagline", value: "Mencetak generasi Qur'ani, berakhlak, dan mandiri" },
  { key: "site_address", value: "Jl. Balekambang Km.01, Selomerto, Wonosobo" },
  { key: "site_phone", value: "" },
  { key: "site_email", value: "" },
  { key: "bank_name", value: "" },
  { key: "bank_account_number", value: "" },
  { key: "bank_account_name", value: "" },
  { key: "ppdb_intro", value: "Pendaftaran santri baru tahun ajaran 2026/2027." },
  { key: "ppdb_force_open", value: "1" },
  { key: "social_facebook", value: "" },
  { key: "social_instagram", value: "" },
  { key: "social_youtube", value: "" },
  { key: "social_tiktok", value: "" },
  { key: "maps_latitude", value: "-7.4147529" },
  { key: "maps_longitude", value: "109.8903904" }
];

const waves = [
  {
    academicYear: "2026/2027",
    code: "G1",
    name: "Gelombang 1",
    opensAt: new Date("2027-01-01T00:00:00+07:00"),
    closesAt: new Date("2027-03-31T23:59:59+07:00"),
    isActive: true
  },
  {
    academicYear: "2026/2027",
    code: "G2",
    name: "Gelombang 2",
    opensAt: new Date("2027-04-01T00:00:00+07:00"),
    closesAt: new Date("2027-07-31T23:59:59+07:00"),
    isActive: true
  }
];

const pages = [
  {
    slug: "profil",
    title: "Profil Pondok",
    content: `Pondok Pesantren Nurul Husna berada di Jl. Balekambang Km.01, Selomerto, Wonosobo, Jawa Tengah.

Pondok ini menaungi pendidikan formal di bawah Yayasan Nurul Husna, yaitu MI Nurul Chusna dan MTs. Nurul Chusna, serta program mondok bagi santri yang mukim.

## Kehidupan santri

Santri yang mondok tinggal di asrama dan mengikuti pembinaan harian pondok. Santri yang memilih mondok saja tetap mendapat pembinaan di pondok tanpa menempuh pendidikan formal di yayasan.

## Pendaftaran

Pendaftaran santri baru dibuka dalam gelombang. Rincian jadwal, kategori, dan biaya tersedia di halaman pendaftaran.`
  },
  {
    slug: "program",
    title: "Program Pendidikan",
    content: `Pondok Pesantren Nurul Husna menyediakan empat pilihan pendaftaran yang menyesuaikan jenjang pendidikan dan kebutuhan keluarga.

## Jenjang formal

MI Nurul Chusna membuka kelas 1 sampai 6, sedangkan MTs. Nurul Chusna membuka kelas 7 sampai 9. Santri yang memilih jenjang formal mondok di asrama.

## Mondok saja

Pilihan mondok saja diperuntukkan bagi santri yang ingin mukim dan mengikuti pembinaan pondok tanpa menempuh pendidikan formal di yayasan.

## Alur pendaftaran

Pendaftaran dilakukan secara online melalui website atau langsung di asrama dengan bantuan pengurus. Setiap pendaftar memperoleh kode pendaftaran yang ditunjukkan saat tiba di asrama.`
  },
  {
    slug: "fasilitas",
    title: "Fasilitas",
    content: `Informasi fasilitas pondok akan segera dilengkapi.`
  },
  {
    slug: "kontak",
    title: "Kontak",
    content: `Pengurus pondok dapat dihubungi pada jam kerja. Untuk informasi pendaftaran, silakan lihat halaman pendaftaran atau datang langsung ke alamat pondok.`
  }
];

async function main() {
  for (const category of categories) {
    await db
      .insert(table.santriCategory)
      .values(category)
      .onConflictDoUpdate({
        target: table.santriCategory.code,
        set: {
          name: category.name,
          institutionName: category.institutionName,
          educationLevel: category.educationLevel,
          gradeRange: category.gradeRange,
          description: category.description,
          sortOrder: category.sortOrder
        }
      });
  }

  for (const wave of waves) {
    const [existing] = await db
      .select()
      .from(table.registrationWave)
      .where(
        and(
          eq(table.registrationWave.academicYear, wave.academicYear),
          eq(table.registrationWave.name, wave.name)
        )
      );

    if (existing) {
      await db
        .update(table.registrationWave)
        .set({
          code: wave.code,
          opensAt: wave.opensAt,
          closesAt: wave.closesAt,
          isActive: wave.isActive,
          updatedAt: new Date()
        })
        .where(eq(table.registrationWave.id, existing.id));
    } else {
      await db.insert(table.registrationWave).values(wave);
    }
  }

  for (const item of settings) {
    await db
      .insert(table.setting)
      .values(item)
      .onConflictDoNothing({ target: table.setting.key });
  }

  for (const item of pages) {
    await db
      .insert(table.page)
      .values(item)
      .onConflictDoNothing({ target: table.page.slug });
  }

  console.log(`Seed selesai: ${categories.length} kategori, pengaturan dasar.`);
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
