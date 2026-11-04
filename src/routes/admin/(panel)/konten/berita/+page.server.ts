import { fail, redirect } from "@sveltejs/kit";
import { desc } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { saveUpload } from "$lib/server/ppdb/storage";
import { uniquePostSlug } from "$lib/server/content/slug";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

const categories = new Set(["berita", "pengumuman"]);
const statuses = new Set(["draft", "published"]);

export const load: PageServerLoad = async () => {
  const posts = await db
    .select()
    .from(table.post)
    .orderBy(desc(table.post.createdAt));

  return { posts };
};

export const actions: Actions = {
  create: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const excerpt = String(formData.get("excerpt") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const slugInput = String(formData.get("slug") ?? "").trim();
    const category = String(formData.get("category") ?? "berita");
    const status = String(formData.get("status") ?? "draft");

    if (!title || !content) {
      return fail(400, { message: "Judul dan isi berita wajib diisi." });
    }

    if (!categories.has(category) || !statuses.has(status)) {
      return fail(400, { message: "Kategori atau status tidak valid." });
    }

    const coverFile = formData.get("cover");
    let coverImage: string | null = null;

    if (coverFile instanceof File && coverFile.size > 0) {
      try {
        coverImage = await saveUpload(coverFile, "public", ["image"]);
      } catch (error) {
        return fail(400, {
          message: error instanceof Error ? error.message : "Gagal mengunggah gambar."
        });
      }
    }

    const slug = await uniquePostSlug(slugInput || title);

    const [created] = await db
      .insert(table.post)
      .values({
        slug,
        title,
        excerpt: excerpt || null,
        content,
        category,
        status: status as "draft" | "published",
        coverImage,
        publishedAt: status === "published" ? new Date() : null,
        authorId: locals.user?.id ?? null
      })
      .returning({ id: table.post.id });

    await logAudit({
      userId: locals.user?.id,
      action: "post.create",
      entityType: "post",
      entityId: created.id,
      metadata: { slug },
      ipAddress: getClientAddress()
    });

    redirect(303, `/admin/konten/berita/${created.id}`);
  }
};
