import { fail, redirect } from "@sveltejs/kit";
import {
  resendOtp,
  verifyOtp
} from "$lib/server/ppdb/otp.service";
import {
  setAccountSessionTokenCookie
} from "$lib/server/ppdb/account-auth";
import { safeNextPath } from "$lib/server/ppdb/navigation";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.ppdbAccount) redirect(303, "/ppdb/akun");

  const phone = url.searchParams.get("phone") ?? "";
  if (!phone) redirect(303, "/ppdb/akun/masuk");

  return {
    phone,
    next: url.searchParams.get("next") ?? "",
    dev: url.searchParams.get("dev") ?? ""
  };
};

export const actions: Actions = {
  verify: async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const phone = String(formData.get("phone") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim();
    const next = safeNextPath(String(formData.get("next") ?? ""), "/ppdb/akun");

    let result: Awaited<ReturnType<typeof verifyOtp>>;

    try {
      result = await verifyOtp({ phone, code });
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Kode OTP tidak valid."
      });
    }

    setAccountSessionTokenCookie(
      { cookies, url },
      result.token,
      result.session.expiresAt
    );

    redirect(303, next);
  },

  resend: async ({ request }) => {
    const formData = await request.formData();
    const phone = String(formData.get("phone") ?? "").trim();
    const next = safeNextPath(String(formData.get("next") ?? ""), "");

    let result: Awaited<ReturnType<typeof resendOtp>>;

    try {
      result = await resendOtp(phone);
    } catch (error) {
      return fail(400, {
        message: error instanceof Error ? error.message : "Gagal mengirim ulang kode OTP."
      });
    }

    const params = new URLSearchParams({ phone: result.phone });
    if (next) params.set("next", next);
    if (result.devCode) params.set("dev", result.devCode);

    redirect(303, `/ppdb/akun/verifikasi?${params.toString()}`);
  }
};
