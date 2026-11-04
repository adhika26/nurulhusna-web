import { fail } from "@sveltejs/kit";
import { getSettingMap, setSettings } from "$lib/server/services/setting.service";
import { logAudit } from "$lib/server/services/audit.service";
import type { Actions, PageServerLoad } from "./$types";

const editableKeys = [
  "site_name",
  "site_tagline",
  "site_address",
  "site_phone",
  "site_email",
  "bank_name",
  "bank_account_number",
  "bank_account_name",
  "ppdb_intro",
  "social_facebook",
  "social_instagram",
  "social_youtube",
  "social_tiktok",
  "maps_latitude",
  "maps_longitude"
];

export const load: PageServerLoad = async () => {
  const settings = await getSettingMap();
  return { settings };
};

export const actions: Actions = {
  default: async ({ request, locals, getClientAddress }) => {
    const formData = await request.formData();
    const entries: Record<string, string> = {};

    for (const key of editableKeys) {
      entries[key] = String(formData.get(key) ?? "").trim();
    }

    entries.ppdb_force_open = formData.get("ppdb_force_open") === "on" ? "1" : "0";

    if (!entries.site_name) {
      return fail(400, { message: "Nama pondok wajib diisi." });
    }

    if (entries.site_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(entries.site_email)) {
      return fail(400, { message: "Format email tidak valid." });
    }

    for (const key of ["social_facebook", "social_instagram", "social_youtube", "social_tiktok"]) {
      if (entries[key] && !/^https?:\/\//i.test(entries[key])) {
        return fail(400, { message: "URL media sosial harus diawali http:// atau https://" });
      }
    }

    for (const [key, label, min, max] of [
      ["maps_latitude", "Latitude", -90, 90],
      ["maps_longitude", "Longitude", -180, 180]
    ] as const) {
      if (!entries[key]) continue;
      const value = Number(entries[key]);
      if (!Number.isFinite(value) || value < min || value > max) {
        return fail(400, { message: `${label} tidak valid.` });
      }
    }

    await setSettings(entries);

    await logAudit({
      userId: locals.user?.id,
      action: "settings.update",
      entityType: "setting",
      ipAddress: getClientAddress()
    });

    return { success: true, message: "Pengaturan disimpan." };
  }
};
