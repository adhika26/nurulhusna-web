import { getPublishedGallery, mediaUrl } from "$lib/server/content/content.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const gallery = await getPublishedGallery(60);

  return {
    gallery: gallery.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: mediaUrl(item.imagePath)
    }))
  };
};
