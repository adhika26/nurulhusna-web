import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import {
  getPublishedGallery,
  getPublishedPage,
  getPublishedPosts,
  mediaUrl
} from "$lib/server/content/content.service";
import type { PageServerLoad } from "./$types";

function plainExcerpt(markdown: string): string {
  const firstBlock = markdown
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>#]/g, "")
    .split(/\n\s*\n/)[0]
    .trim();

  return firstBlock.length > 320 ? `${firstBlock.slice(0, 317)}...` : firstBlock;
}

export const load: PageServerLoad = async () => {
  const [profile, posts, gallery, categories] = await Promise.all([
    getPublishedPage("profil"),
    getPublishedPosts(3),
    getPublishedGallery(4),
    db
      .select()
      .from(table.santriCategory)
      .where(eq(table.santriCategory.isActive, true))
      .orderBy(asc(table.santriCategory.sortOrder))
  ]);

  return {
    profileExcerpt: profile ? plainExcerpt(profile.content) : null,
    categories: categories.map((category) => ({
      code: category.code,
      name: category.name,
      institutionName: category.institutionName,
      gradeRange: category.gradeRange,
      description: category.description
    })),
    posts: posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt,
      coverUrl: mediaUrl(post.coverImage)
    })),
    gallery: gallery.map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: mediaUrl(item.imagePath)
    }))
  };
};
