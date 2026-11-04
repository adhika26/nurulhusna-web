import { error } from "@sveltejs/kit";
import { getPublishedPage } from "$lib/server/content/content.service";
import { renderMarkdown } from "$lib/server/content/markdown";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const page = await getPublishedPage(params.slug);

  if (!page) error(404, "Halaman tidak ditemukan.");

  return {
    page: {
      title: page.title,
      html: renderMarkdown(page.content),
      updatedAt: page.updatedAt
    }
  };
};
