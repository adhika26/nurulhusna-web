import { getPublishedGallery, getPublishedPage, mediaUrl } from "$lib/server/content/content.service";
import { renderMarkdown } from "$lib/server/content/markdown";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const [page, gallery] = await Promise.all([
    getPublishedPage("fasilitas"),
    getPublishedGallery(9)
  ]);

  return {
    page: page ? { title: page.title, html: renderMarkdown(page.content) } : null,
    gallery: gallery.map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: mediaUrl(item.imagePath)
    }))
  };
};
