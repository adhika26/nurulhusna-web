import { getSettingMap } from "$lib/server/services/setting.service";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
  const settings = await getSettingMap();

  return {
    site: {
      name: settings.site_name || "Pondok Pesantren Nurul Husna",
      tagline: settings.site_tagline || "",
      address: settings.site_address || "Jl. Balekambang Km.01, Selomerto, Wonosobo",
      phone: settings.site_phone || "",
      email: settings.site_email || ""
    }
  };
};
