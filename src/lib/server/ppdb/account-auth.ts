import type { RequestEvent } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const accountSessionCookieName = "ppdb-account-session";

export type AccountUser = {
  id: string;
  phone: string;
  fullName: string;
};

export type AccountSessionData = {
  id: string;
  accountId: string;
  expiresAt: Date;
};

export type AccountValidationResult =
  | { session: AccountSessionData; account: AccountUser }
  | { session: null; account: null };

export function generateAccountSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return encodeBase64url(bytes);
}

function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createAccountSession(
  token: string,
  accountId: string
): Promise<AccountSessionData> {
  const session: AccountSessionData = {
    id: hashToken(token),
    accountId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
  };

  await db.insert(table.ppdbAccountSession).values(session);
  return session;
}

export async function validateAccountSessionToken(
  token: string
): Promise<AccountValidationResult> {
  const sessionId = hashToken(token);

  const [result] = await db
    .select({
      session: table.ppdbAccountSession,
      account: table.ppdbAccount
    })
    .from(table.ppdbAccountSession)
    .innerJoin(table.ppdbAccount, eq(table.ppdbAccountSession.accountId, table.ppdbAccount.id))
    .where(eq(table.ppdbAccountSession.id, sessionId));

  if (!result) return { session: null, account: null };

  const { session, account } = result;

  if (Date.now() >= session.expiresAt.getTime() || !account.isActive) {
    await db.delete(table.ppdbAccountSession).where(eq(table.ppdbAccountSession.id, session.id));
    return { session: null, account: null };
  }

  if (Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(table.ppdbAccountSession)
      .set({ expiresAt: session.expiresAt })
      .where(eq(table.ppdbAccountSession.id, session.id));
  }

  return {
    session: {
      id: session.id,
      accountId: session.accountId,
      expiresAt: session.expiresAt
    },
    account: {
      id: account.id,
      phone: account.phone,
      fullName: account.fullName
    }
  };
}

export async function invalidateAccountSession(sessionId: string): Promise<void> {
  await db.delete(table.ppdbAccountSession).where(eq(table.ppdbAccountSession.id, sessionId));
}

type CookieJar = Pick<RequestEvent, "cookies" | "url">;

export function setAccountSessionTokenCookie(
  event: CookieJar,
  token: string,
  expiresAt: Date
): void {
  event.cookies.set(accountSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: event.url.protocol === "https:",
    expires: expiresAt,
    path: "/"
  });
}

export function deleteAccountSessionTokenCookie(event: CookieJar): void {
  event.cookies.delete(accountSessionCookieName, {
    path: "/",
    secure: event.url.protocol === "https:"
  });
}
