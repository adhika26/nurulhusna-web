import { getPublishedPage } from "$lib/server/content/content.service";
import { renderMarkdown } from "$lib/server/content/markdown";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const page = await getPublishedPage("profil");

  return {
    page: page
      ? { title: page.title, html: renderMarkdown(page.content), updatedAt: page.updatedAt }
      : null
  };
};
