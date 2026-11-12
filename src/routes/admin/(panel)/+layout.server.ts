import { error, redirect } from "@sveltejs/kit";
import { canOpenArea } from "$lib/server/roles";
import type { LayoutServerLoad } from "./$types";

const restrictedAreas: Array<{ prefix: string; area: string }> = [
  { prefix: "/admin/keuangan", area: "keuangan" },
  { prefix: "/admin/pembayaran", area: "pembayaran" },
  { prefix: "/admin/pendaftaran", area: "pendaftaran" },
  { prefix: "/admin/santri", area: "santri" },
  { prefix: "/admin/asrama", area: "asrama" },
  { prefix: "/admin/master", area: "master" },
  { prefix: "/admin/konten", area: "konten" },
  { prefix: "/admin/pengaturan", area: "pengaturan" },
  { prefix: "/admin/pengguna", area: "pengguna" }
];

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) redirect(303, "/admin/login");

  const restricted = restrictedAreas.find((item) => url.pathname.startsWith(item.prefix));

  if (restricted && !canOpenArea(locals.user.role, restricted.area)) {
    error(403, "Anda tidak memiliki akses ke halaman ini.");
  }

  return { user: locals.user };
};
