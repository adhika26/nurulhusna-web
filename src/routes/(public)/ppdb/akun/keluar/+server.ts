import { redirect } from "@sveltejs/kit";
import {
  deleteAccountSessionTokenCookie,
  invalidateAccountSession
} from "$lib/server/ppdb/account-auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, cookies, url }) => {
  if (locals.ppdbAccountSession) {
    await invalidateAccountSession(locals.ppdbAccountSession.id);
  }

  deleteAccountSessionTokenCookie({ cookies, url });
  redirect(303, "/ppdb");
};
