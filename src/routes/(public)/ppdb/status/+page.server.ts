import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import {
  ACCESS_DURATION_MS,
  accessCookieName,
  createAccessToken,
  normalizePhone
} from "$lib/server/ppdb/access";
import type { Actions, PageServerLoad } from "./$types";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 12;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isAllowed(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

export const load: PageServerLoad = async ({ url }) => {
  return { kode: (url.searchParams.get("kode") ?? "").toUpperCase() };
};

export const actions: Actions = {
  default: async ({ request, cookies, getClientAddress }) => {
    if (!isAllowed(getClientAddress())) {
      return fail(429, { message: "Terlalu banyak percobaan. Silakan coba lagi beberapa saat." });
    }

    const formData = await request.formData();
    const code = String(formData.get("kode") ?? "").trim().toUpperCase();
    const phone = normalizePhone(String(formData.get("phone") ?? ""));

    if (!code || !phone) {
      return fail(400, { message: "Kode pendaftaran dan nomor HP wajib diisi.", kode: code });
    }

    const [registration] = await db
      .select()
      .from(table.registration)
      .where(eq(table.registration.code, code));

    if (!registration) {
      return fail(400, {
        message: "Kode pendaftaran dan nomor HP tidak cocok.",
        kode: code
      });
    }

    const guardians = await db
      .select()
      .from(table.guardian)
      .where(eq(table.guardian.registrationId, registration.id));

    const phones = [registration.phone, ...guardians.map((item) => item.phone)]
      .map(normalizePhone)
      .filter(Boolean);

    if (!phones.includes(phone)) {
      return fail(400, {
        message: "Kode pendaftaran dan nomor HP tidak cocok.",
        kode: code
      });
    }

    cookies.set(accessCookieName, createAccessToken(registration.id), {
      path: "/ppdb/status",
      httpOnly: true,
      sameSite: "lax",
      maxAge: ACCESS_DURATION_MS / 1000
    });

    redirect(303, `/ppdb/status/${registration.code}`);
  }
};
