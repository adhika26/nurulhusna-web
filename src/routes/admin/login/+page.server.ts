import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import * as auth from "$lib/server/auth";
import { roleHome } from "$lib/types/roles";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(303, roleHome(locals.user.role));
  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!username || !password) {
      return fail(400, { message: "Username dan password wajib diisi.", username });
    }

    const [user] = await db.select().from(table.user).where(eq(table.user.username, username));

    if (!user) {
      return fail(400, { message: "Username atau password salah.", username });
    }

    const valid = await verify(user.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });

    if (!valid) {
      return fail(400, { message: "Username atau password salah.", username });
    }

    if (!user.isActive) {
      return fail(403, { message: "Akun ini sedang dinonaktifkan.", username });
    }

    const token = auth.generateSessionToken();
    const session = await auth.createSession(token, user.id);
    auth.setSessionTokenCookie(event, token, session.expiresAt);

    await db
      .update(table.user)
      .set({ lastLoginAt: new Date() })
      .where(eq(table.user.id, user.id));

    redirect(303, roleHome(user.role));
  }
};
