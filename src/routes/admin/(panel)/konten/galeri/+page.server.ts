import { fail } from "@sveltejs/kit";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { saveUpload } from "$lib/server/ppdb/storage";
import { mediaUrl } from "$lib/server/content/content.service";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const items = await db
    .select()
    .from(table.galleryItem)
    .orderBy(asc(table.galleryItem.sortOrder), desc(table.galleryItem.createdAt));

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      isPublished: item.isPublished,
      imageUrl: mediaUrl(item.imagePath)
    }))
  };
};

export const actions: Actions = {
  create: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return fail(400, { message: "Pilih foto yang akan diunggah." });
    }

    let imagePath: string;

    try {
      imagePath = await saveUpload(image, "public", ["image"]);
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal mengunggah foto."
      });
    }

    const [created] = await db
      .insert(table.galleryItem)
      .values({
        title: title || null,
        description: description || null,
        imagePath,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isPublished: formData.get("isPublished") === "on"
      })
      .returning({ id: table.galleryItem.id });

    await logAudit({
      userId: locals.user?.id,
      action: "gallery.create",
      entityType: "gallery_item",
      entityId: created.id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Foto ditambahkan ke galeri." };
  },

  toggle: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");

    const [item] = await db
      .select()
      .from(table.galleryItem)
      .where(eq(table.galleryItem.id, id));

    if (!item) return fail(404, { message: "Foto tidak ditemukan." });

    await db
      .update(table.galleryItem)
      .set({ isPublished: !item.isPublished })
      .where(eq(table.galleryItem.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: "gallery.toggle",
      entityType: "gallery_item",
      entityId: id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Status foto diperbarui." };
  },

  delete: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");

    await db.delete(table.galleryItem).where(eq(table.galleryItem.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: "gallery.delete",
      entityType: "gallery_item",
      entityId: id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Foto dihapus dari galeri." };
  }
};
