import { fail } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { logAudit } from "$lib/server/services/audit.service";
import { uniquePageSlug } from "$lib/server/content/slug";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const pages = await db
    .select()
    .from(table.page)
    .orderBy(asc(table.page.slug));

  return { pages };
};

export const actions: Actions = {
  create: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const slugInput = String(formData.get("slug") ?? "").trim();

    if (!title || !content) {
      return fail(400, { message: "Judul dan isi halaman wajib diisi." });
    }

    const slug = await uniquePageSlug(slugInput || title);

    const [created] = await db
      .insert(table.page)
      .values({ slug, title, content, isPublished: formData.get("isPublished") === "on" })
      .returning({ id: table.page.id });

    await logAudit({
      userId: locals.user?.id,
      action: "page.create",
      entityType: "page",
      entityId: created.id,
      metadata: { slug },
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Halaman "${title}" dibuat.` };
  },

  update: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const slugInput = String(formData.get("slug") ?? "").trim();

    if (!id || !title || !content) {
      return fail(400, { message: "Judul dan isi halaman wajib diisi." });
    }

    const slug = await uniquePageSlug(slugInput || title, id);

    await db
      .update(table.page)
      .set({
        slug,
        title,
        content,
        isPublished: formData.get("isPublished") === "on",
        updatedAt: new Date()
      })
      .where(eq(table.page.id, id));

    await logAudit({
      userId: locals.user?.id,
      action: "page.update",
      entityType: "page",
      entityId: id,
      ipAddress: getClientAddress()
    });

    return { success: true, message: `Halaman "${title}" disimpan.` };
  }
};
