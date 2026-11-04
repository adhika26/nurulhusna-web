import { error } from "@sveltejs/kit";
import { getPublishedPost, mediaUrl } from "$lib/server/content/content.service";
import { renderMarkdown } from "$lib/server/content/markdown";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const post = await getPublishedPost(params.slug);

  if (!post) error(404, "Berita tidak ditemukan.");

  return {
    post: {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt,
      coverUrl: mediaUrl(post.coverImage),
      html: renderMarkdown(post.content)
    }
  };
};
