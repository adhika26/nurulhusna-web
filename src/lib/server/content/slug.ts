import { and, eq, ne } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { slugify } from "$lib/utils/format";

function baseSlug(input: string, fallback: string): string {
  return slugify(input) || `${fallback}-${Date.now().toString(36)}`;
}

export async function uniquePageSlug(input: string, excludeId?: string): Promise<string> {
  const base = baseSlug(input, "halaman");
  const [existing] = await db
    .select({ id: table.page.id })
    .from(table.page)
    .where(
      excludeId
        ? and(eq(table.page.slug, base), ne(table.page.id, excludeId))
        : eq(table.page.slug, base)
    );

  return existing ? `${base}-${Date.now().toString(36)}` : base;
}

export async function uniquePostSlug(input: string, excludeId?: string): Promise<string> {
  const base = baseSlug(input, "berita");
  const [existing] = await db
    .select({ id: table.post.id })
    .from(table.post)
    .where(
      excludeId
        ? and(eq(table.post.slug, base), ne(table.post.id, excludeId))
        : eq(table.post.slug, base)
    );

  return existing ? `${base}-${Date.now().toString(36)}` : base;
}
