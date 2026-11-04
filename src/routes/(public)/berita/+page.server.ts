import { getPublishedPosts, mediaUrl } from "$lib/server/content/content.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const posts = await getPublishedPosts(50);

  return {
    posts: posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt,
      coverUrl: mediaUrl(post.coverImage)
    }))
  };
};
