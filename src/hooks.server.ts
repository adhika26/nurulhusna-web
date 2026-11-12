import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import * as accountAuth from "$lib/server/ppdb/account-auth";

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(auth.sessionCookieName) ?? null;

  if (token) {
    const { session, user } = await auth.validateSessionToken(token);

    if (session) {
      auth.setSessionTokenCookie(event, token, session.expiresAt);
    } else {
      auth.deleteSessionTokenCookie(event);
    }

    event.locals.user = user;
    event.locals.session = session;
  } else {
    event.locals.user = null;
    event.locals.session = null;
  }

  const accountToken = event.cookies.get(accountAuth.accountSessionCookieName) ?? null;

  if (accountToken) {
    const { session, account } = await accountAuth.validateAccountSessionToken(accountToken);

    if (session) {
      accountAuth.setAccountSessionTokenCookie(event, accountToken, session.expiresAt);
    } else {
      accountAuth.deleteAccountSessionTokenCookie(event);
    }

    event.locals.ppdbAccount = account;
    event.locals.ppdbAccountSession = session;
  } else {
    event.locals.ppdbAccount = null;
    event.locals.ppdbAccountSession = null;
  }

  return resolve(event);
};
