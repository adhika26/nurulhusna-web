import { getPublishedPosts } from "$lib/server/content/content.service";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const origin = process.env.PUBLIC_ORIGIN || url.origin;
  const paths = ["/", "/profil", "/program", "/fasilitas", "/galeri", "/berita", "/kontak", "/ppdb"];
  const posts = await getPublishedPosts(500);

  const entries = [
    ...paths.map((path) => ({ loc: `${origin}${path}`, lastmod: null })),
    ...posts.map((post) => ({
      loc: `${origin}/berita/${post.slug}`,
      lastmod: post.updatedAt.toISOString()
    }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600"
    }
  });
};
