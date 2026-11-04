/**
 * Impor data wilayah Indonesia (provinsi, kabupaten/kota, kecamatan,
 * desa/kelurahan) dari file SQL Kepmendagri.
 *
 * Jalankan: npm run db:import-wilayah
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db, client } from "../src/lib/server/db";
import * as table from "../src/lib/server/db/schema";

const file = process.env.WILAYAH_SQL ?? join(process.cwd(), "data/geo/wilayah.sql");
const sql = readFileSync(file, "utf8");

const tuple = /\('(\d{2}(?:\.\d{2,4}){0,3})','((?:[^']|'')*)'\)/g;

const provinces = new Map<string, string>();
const regencies = new Map<string, string>();
const districts = new Map<string, string>();
const villages = new Map<string, string>();

let match: RegExpExecArray | null;

while ((match = tuple.exec(sql)) !== null) {
  const id = match[1];
  const name = match[2].replace(/''/g, "'");
  const depth = id.split(".").length;

  if (depth === 1) provinces.set(id, name);
  else if (depth === 2) regencies.set(id, name);
  else if (depth === 3) districts.set(id, name);
  else if (depth === 4) villages.set(id, name);
}

console.log(
  `Terbaca: ${provinces.size} provinsi, ${regencies.size} kab/kota, ${districts.size} kecamatan, ${villages.size} desa/kelurahan.`
);

const CHUNK = 1000;

async function insertChunked<T>(
  label: string,
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>
) {
  for (let index = 0; index < rows.length; index += CHUNK) {
    await insert(rows.slice(index, index + CHUNK));
  }
  console.log(`  ${label}: ${rows.length} baris`);
}

async function main() {
  console.log("Menghapus data wilayah lama...");
  await db.delete(table.village);
  await db.delete(table.district);
  await db.delete(table.regency);
  await db.delete(table.province);

  console.log("Mengimpor...");

  await insertChunked(
    "provinsi",
    [...provinces].map(([id, name]) => ({ id, name })),
    (chunk) => db.insert(table.province).values(chunk).onConflictDoNothing()
  );

  await insertChunked(
    "kabupaten/kota",
    [...regencies].map(([id, name]) => ({ id, provinceId: id.slice(0, 2), name })),
    (chunk) => db.insert(table.regency).values(chunk).onConflictDoNothing()
  );

  await insertChunked(
    "kecamatan",
    [...districts].map(([id, name]) => ({ id, regencyId: id.slice(0, 5), name })),
    (chunk) => db.insert(table.district).values(chunk).onConflictDoNothing()
  );

  await insertChunked(
    "desa/kelurahan",
    [...villages].map(([id, name]) => ({ id, districtId: id.slice(0, 8), name })),
    (chunk) => db.insert(table.village).values(chunk).onConflictDoNothing()
  );

  console.log("Selesai.");
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
