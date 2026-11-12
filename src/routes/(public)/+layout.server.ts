import { getSettingMap } from "$lib/server/services/setting.service";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const settings = await getSettingMap();

  return {
    account: locals.ppdbAccount
      ? { fullName: locals.ppdbAccount.fullName, phone: locals.ppdbAccount.phone }
      : null,
    site: {
      name: settings.site_name || "Pondok Pesantren Nurul Husna",
      tagline: settings.site_tagline || "",
      address: settings.site_address || "Jl. Balekambang Km.01, Selomerto, Wonosobo",
      phone: settings.site_phone || "",
      email: settings.site_email || "",
      socials: {
        facebook: settings.social_facebook || "",
        instagram: settings.social_instagram || "",
        youtube: settings.social_youtube || "",
        tiktok: settings.social_tiktok || ""
      },
      coordinates: {
        latitude: settings.maps_latitude || "",
        longitude: settings.maps_longitude || ""
      }
    }
  };
};
