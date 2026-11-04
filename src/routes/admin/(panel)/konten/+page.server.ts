import { count, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const [[pageCount], [postCount], [publishedPostCount], [galleryCount]] = await Promise.all([
    db.select({ value: count() }).from(table.page),
    db.select({ value: count() }).from(table.post),
    db
      .select({ value: count() })
      .from(table.post)
      .where(eq(table.post.status, "published")),
    db.select({ value: count() }).from(table.galleryItem)
  ]);

  return {
    counts: {
      pages: Number(pageCount?.value ?? 0),
      posts: Number(postCount?.value ?? 0),
      publishedPosts: Number(publishedPostCount?.value ?? 0),
      gallery: Number(galleryCount?.value ?? 0)
    }
  };
};
