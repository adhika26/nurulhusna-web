/**
 * Membuat data contoh untuk mengecek tampilan galeri dan berita.
 *
 * Jalankan: npm run db:seed-dummy
 * Hapus:    npm run db:seed-dummy -- --clean
 */
import { mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { like } from "drizzle-orm";
import sharp from "sharp";
import { db, client } from "../src/lib/server/db";
import * as table from "../src/lib/server/db/schema";

const uploadRoot = process.env.UPLOAD_DIR ?? "./data/uploads";
const publicDir = join(uploadRoot, "public");
const clean = process.argv.includes("--clean");

const images = Array.from({ length: 6 }, (_, index) => ({
  file: `dummy-gallery-${index + 1}.png`,
  title: `Contoh Foto ${index + 1}`,
  sortOrder: index + 1
}));

function placeholderSvg(index: number): string {
  const tones = ["#124431", "#16523a", "#196545", "#14532d", "#1b6042", "#0f3d2a"];
  const background = tones[index % tones.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <rect width="1200" height="900" fill="${background}"/>
    <circle cx="600" cy="900" r="700" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
    <circle cx="600" cy="900" r="560" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
    <circle cx="600" cy="900" r="420" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
    <text x="600" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff">
      Contoh Foto ${index + 1}
    </text>
    <text x="600" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#bbf7d1">
      Pondok Pesantren Nurul Husna
    </text>
    <text x="600" y="550" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#8cd1ab">
      Data contoh untuk pengecekan tampilan
    </text>
  </svg>`;
}

async function removeDummy() {
  await db.delete(table.post).where(like(table.post.slug, "contoh-%"));
  await db.delete(table.galleryItem).where(like(table.galleryItem.title, "Contoh Foto%"));

  for (const image of images) {
    try {
      await unlink(join(publicDir, image.file));
    } catch {
      // File mungkin sudah tidak ada.
    }
  }

  console.log("Data contoh dihapus.");
}

async function seedDummy() {
  await removeDummy();
  await mkdir(publicDir, { recursive: true });

  for (const [index, image] of images.entries()) {
    await sharp(Buffer.from(placeholderSvg(index)))
      .png()
      .toFile(join(publicDir, image.file));
  }

  await db.insert(table.galleryItem).values(
    images.map((image) => ({
      title: image.title,
      description: "Data contoh untuk mengecek tampilan galeri.",
      imagePath: `public/${image.file}`,
      sortOrder: image.sortOrder,
      isPublished: true
    }))
  );

  const posts = [
    {
      slug: "contoh-berita-1",
      title: "Contoh Berita 1: Kegiatan Santri",
      excerpt: "Data contoh untuk mengecek tampilan daftar berita dan halaman detail.",
      category: "berita",
      coverImage: "public/dummy-gallery-1.png",
      content: `## Contoh berita

Ini adalah data contoh untuk mengecek tampilan berita. Ganti atau hapus melalui panel admin.

- Poin pertama contoh
- Poin kedua contoh
- Poin ketiga contoh`
    },
    {
      slug: "contoh-pengumuman-1",
      title: "Contoh Pengumuman 1: Jadwal Pendaftaran",
      excerpt: "Data contoh untuk mengecek label pengumuman dan tata letak kartu.",
      category: "pengumuman",
      coverImage: "public/dummy-gallery-2.png",
      content: `## Contoh pengumuman

Ini adalah data contoh untuk mengecek tampilan pengumuman. Silakan ganti dengan informasi resmi.

Pendaftaran dibuka dalam dua gelombang. Rincian jadwal dapat dilihat di halaman pendaftaran.`
    },
    {
      slug: "contoh-berita-2",
      title: "Contoh Berita 2: Suasana Pondok",
      excerpt: "Data contoh untuk mengecek tampilan tanpa gambar sampul.",
      category: "berita",
      coverImage: null,
      content: `## Contoh berita tanpa sampul

Data contoh ini dipakai untuk memastikan halaman detail tetap rapi ketika berita tidak memiliki gambar sampul.`
    }
  ];

  const now = Date.now();

  await db.insert(table.post).values(
    posts.map((post, index) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      coverImage: post.coverImage,
      status: "published" as const,
      publishedAt: new Date(now - index * 24 * 60 * 60 * 1000),
      authorId: null
    }))
  );

  console.log(`Data contoh dibuat: ${images.length} foto, ${posts.length} berita.`);
}

async function main() {
  if (clean) {
    await removeDummy();
  } else {
    await seedDummy();
  }

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
