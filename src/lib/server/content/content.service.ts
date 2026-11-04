import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

export async function getPublishedPage(slug: string) {
  const [row] = await db
    .select()
    .from(table.page)
    .where(and(eq(table.page.slug, slug), eq(table.page.isPublished, true)));

  return row ?? null;
}

export async function getPublishedPosts(limit = 20) {
  return db
    .select()
    .from(table.post)
    .where(eq(table.post.status, "published"))
    .orderBy(desc(table.post.publishedAt), desc(table.post.createdAt))
    .limit(limit);
}

export async function getPublishedPost(slug: string) {
  const [row] = await db
    .select()
    .from(table.post)
    .where(and(eq(table.post.slug, slug), eq(table.post.status, "published")));

  return row ?? null;
}

export async function getPublishedGallery(limit = 40) {
  return db
    .select()
    .from(table.galleryItem)
    .where(eq(table.galleryItem.isPublished, true))
    .orderBy(asc(table.galleryItem.sortOrder), desc(table.galleryItem.createdAt))
    .limit(limit);
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `/media/${path}`;
}
