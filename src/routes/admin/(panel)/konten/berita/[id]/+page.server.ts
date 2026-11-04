import { error, fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { saveUpload } from "$lib/server/ppdb/storage";
import { uniquePostSlug } from "$lib/server/content/slug";
import { mediaUrl } from "$lib/server/content/content.service";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

const categories = new Set(["berita", "pengumuman"]);
const statuses = new Set(["draft", "published"]);

export const load: PageServerLoad = async ({ params }) => {
  const [post] = await db.select().from(table.post).where(eq(table.post.id, params.id));

  if (!post) error(404, "Berita tidak ditemukan.");

  return {
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      status: post.status,
      coverUrl: mediaUrl(post.coverImage),
      publishedAt: post.publishedAt
    }
  };
};

export const actions: Actions = {
  update: async ({ params, request, locals, getClientAddress }) => {
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

    const [existing] = await db.select().from(table.post).where(eq(table.post.id, params.id));

    if (!existing) return fail(404, { message: "Berita tidak ditemukan." });

    const coverFile = formData.get("cover");
    let coverImage = existing.coverImage;

    if (coverFile instanceof File && coverFile.size > 0) {
      try {
        coverImage = await saveUpload(coverFile, "public", ["image"]);
      } catch (error) {
        return fail(400, {
          message: error instanceof Error ? error.message : "Gagal mengunggah gambar."
        });
      }
    }

    if (formData.get("removeCover") === "on") {
      coverImage = null;
    }

    const slug = await uniquePostSlug(slugInput || title, params.id);

    await db
      .update(table.post)
      .set({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        category,
        status: status as "draft" | "published",
        coverImage,
        publishedAt:
          status === "published" ? (existing.publishedAt ?? new Date()) : null,
        updatedAt: new Date()
      })
      .where(eq(table.post.id, params.id));

    await logAudit({
      userId: locals.user?.id,
      action: "post.update",
      entityType: "post",
      entityId: params.id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Berita disimpan." };
  },

  delete: async ({ params, locals, getClientAddress }) => {
    await db.delete(table.post).where(eq(table.post.id, params.id));

    await logAudit({
      userId: locals.user?.id,
      action: "post.delete",
      entityType: "post",
      entityId: params.id,
      ipAddress: getClientAddress()
    });

    redirect(303, "/admin/konten/berita");
  }
};
