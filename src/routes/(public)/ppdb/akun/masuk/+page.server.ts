import { fail, redirect } from "@sveltejs/kit";
import { requestOtp } from "$lib/server/ppdb/otp.service";
import { safeNextPath } from "$lib/server/ppdb/navigation";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.ppdbAccount) redirect(303, "/ppdb/akun");

  return { next: url.searchParams.get("next") ?? "" };
};

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const formData = await request.formData();
    const phone = String(formData.get("phone") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const next = safeNextPath(String(formData.get("next") ?? ""), "");

    if (!phone) {
      return fail(400, { message: "Nomor WhatsApp wajib diisi.", phone, fullName, next });
    }

    let result: Awaited<ReturnType<typeof requestOtp>>;

    try {
      result = await requestOtp({ phone, fullName, ipAddress: getClientAddress() });
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal mengirim kode OTP.",
        phone,
        fullName,
        next
      });
    }

    const params = new URLSearchParams({ phone: result.phone });
    if (next) params.set("next", next);
    if (result.devCode) params.set("dev", result.devCode);

    redirect(303, `/ppdb/akun/verifikasi?${params.toString()}`);
  }
};
