import type { RequestEvent } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = "admin-session";

export type SessionUser = {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  role: "admin" | "staff";
};

export type SessionData = {
  id: string;
  userId: number;
  expiresAt: Date;
};

export type SessionValidationResult =
  | { session: SessionData; user: SessionUser }
  | { session: null; user: null };

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return encodeBase64url(bytes);
}

function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(token: string, userId: number): Promise<SessionData> {
  const session: SessionData = {
    id: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
  };
  await db.insert(table.session).values(session);
  return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = hashToken(token);

  const [result] = await db
    .select({
      user: {
        id: table.user.id,
        username: table.user.username,
        email: table.user.email,
        fullName: table.user.fullName,
        role: table.user.role,
        isActive: table.user.isActive
      },
      session: table.session
    })
    .from(table.session)
    .innerJoin(table.user, eq(table.session.userId, table.user.id))
    .where(eq(table.session.id, sessionId));

  if (!result) return { session: null, user: null };

  const { session, user } = result;

  if (Date.now() >= session.expiresAt.getTime() || !user.isActive) {
    await db.delete(table.session).where(eq(table.session.id, session.id));
    return { session: null, user: null };
  }

  // Perpanjang sesi jika tersisa kurang dari 15 hari.
  if (Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(table.session)
      .set({ expiresAt: session.expiresAt })
      .where(eq(table.session.id, session.id));
  }

  return {
    session: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt
    },
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(table.session).where(eq(table.session.id, sessionId));
}

type CookieJar = Pick<RequestEvent, "cookies">;

export function setSessionTokenCookie(event: CookieJar, token: string, expiresAt: Date): void {
  event.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/"
  });
}

export function deleteSessionTokenCookie(event: CookieJar): void {
  event.cookies.delete(sessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}
