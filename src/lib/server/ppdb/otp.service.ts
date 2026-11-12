import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { appSecretKey, normalizePhone } from "./access";
import {
  createAccountSession,
  generateAccountSessionToken,
  type AccountSessionData,
  type AccountUser
} from "./account-auth";
import { isOtpDevMode, sendOtpMessage } from "./whatsapp.service";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_PER_HOUR = 5;
const PHONE_PATTERN = /^08\d{8,12}$/;

export type RequestOtpInput = {
  phone: string;
  fullName?: string | null;
  ipAddress?: string | null;
};

export type RequestOtpResult = {
  phone: string;
  devCode: string | null;
  retryAfter: number;
};

export type VerifyOtpResult = {
  account: AccountUser;
  token: string;
  session: AccountSessionData;
};

function hashCode(phone: string, code: string): string {
  return createHmac("sha256", appSecretKey).update(`${phone}:${code}`).digest("hex");
}

function sameHash(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function linkRegistrationsToAccount(accountId: string, phone: string): Promise<void> {
  const registrations = await db
    .select({ id: table.registration.id, phone: table.registration.phone })
    .from(table.registration)
    .where(and(isNull(table.registration.accountId), isNotNull(table.registration.phone)));

  const guardians = await db
    .select({
      registrationId: table.guardian.registrationId,
      phone: table.guardian.phone
    })
    .from(table.guardian)
    .innerJoin(table.registration, eq(table.registration.id, table.guardian.registrationId))
    .where(and(isNull(table.registration.accountId), isNotNull(table.guardian.phone)));

  const ids = new Set<string>();

  for (const registration of registrations) {
    if (normalizePhone(registration.phone) === phone) ids.add(registration.id);
  }

  for (const guardian of guardians) {
    if (normalizePhone(guardian.phone) === phone) ids.add(guardian.registrationId);
  }

  if (ids.size === 0) return;

  await db
    .update(table.registration)
    .set({ accountId, updatedAt: new Date() })
    .where(inArray(table.registration.id, [...ids]));
}

function normalizePhoneOrThrow(value: string): string {
  const phone = normalizePhone(value);
  if (!PHONE_PATTERN.test(phone)) {
    throw new Error("Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.");
  }
  return phone;
}

export async function requestOtp(input: RequestOtpInput): Promise<RequestOtpResult> {
  const phone = normalizePhoneOrThrow(input.phone);
  const fullName = input.fullName?.trim().slice(0, 160) || null;
  const now = new Date();

  const cleanupCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await db
    .delete(table.ppdbOtp)
    .where(
      or(
        lt(table.ppdbOtp.expiresAt, cleanupCutoff),
        lt(table.ppdbOtp.consumedAt, cleanupCutoff)
      )
    );

  const [recent] = await db
    .select({ createdAt: table.ppdbOtp.createdAt })
    .from(table.ppdbOtp)
    .where(
      and(eq(table.ppdbOtp.phone, phone), gte(table.ppdbOtp.createdAt, new Date(now.getTime() - RESEND_MS)))
    )
    .orderBy(desc(table.ppdbOtp.createdAt))
    .limit(1);

  if (recent) {
    const wait = Math.ceil((recent.createdAt.getTime() + RESEND_MS - now.getTime()) / 1000);
    throw new Error(`Tunggu ${Math.max(wait, 1)} detik sebelum meminta kode lagi.`);
  }

  const lastHour = await db
    .select({ id: table.ppdbOtp.id })
    .from(table.ppdbOtp)
    .where(
      and(eq(table.ppdbOtp.phone, phone), gte(table.ppdbOtp.createdAt, new Date(now.getTime() - 60 * 60 * 1000)))
    );

  if (lastHour.length >= MAX_PER_HOUR) {
    throw new Error("Terlalu banyak permintaan OTP. Coba lagi dalam satu jam.");
  }

  if (input.ipAddress) {
    const fromSameIp = await db
      .select({ id: table.ppdbOtp.id })
      .from(table.ppdbOtp)
      .where(
        and(
          eq(table.ppdbOtp.ipAddress, input.ipAddress),
          gte(table.ppdbOtp.createdAt, new Date(now.getTime() - 60 * 60 * 1000))
        )
      );

    if (fromSameIp.length >= 20) {
      throw new Error("Terlalu banyak permintaan OTP dari jaringan ini. Coba lagi nanti.");
    }
  }

  await db
    .update(table.ppdbOtp)
    .set({ consumedAt: now })
    .where(and(eq(table.ppdbOtp.phone, phone), isNull(table.ppdbOtp.consumedAt)));

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  const [otp] = await db
    .insert(table.ppdbOtp)
    .values({
      phone,
      fullName,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      ipAddress: input.ipAddress ?? null
    })
    .returning({ id: table.ppdbOtp.id });

  try {
    await sendOtpMessage(phone, code);
  } catch (error) {
    await db
      .update(table.ppdbOtp)
      .set({ consumedAt: new Date() })
      .where(eq(table.ppdbOtp.id, otp.id));
    throw error;
  }

  return {
    phone,
    devCode: isOtpDevMode() ? code : null,
    retryAfter: 60
  };
}

export async function verifyOtp(input: {
  phone: string;
  code: string;
}): Promise<VerifyOtpResult> {
  const phone = normalizePhoneOrThrow(input.phone);
  const code = input.code.replace(/\D/g, "");

  if (code.length !== 6) {
    throw new Error("Kode OTP harus 6 digit.");
  }

  const [otp] = await db
    .select()
    .from(table.ppdbOtp)
    .where(and(eq(table.ppdbOtp.phone, phone), isNull(table.ppdbOtp.consumedAt)))
    .orderBy(desc(table.ppdbOtp.createdAt))
    .limit(1);

  if (!otp) throw new Error("Kode OTP tidak ditemukan. Silakan minta kode baru.");

  if (otp.expiresAt.getTime() < Date.now()) {
    throw new Error("Kode OTP sudah kedaluwarsa. Silakan minta kode baru.");
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new Error("Terlalu banyak percobaan. Silakan minta kode baru.");
  }

  if (!sameHash(hashCode(phone, code), otp.codeHash)) {
    await db
      .update(table.ppdbOtp)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(table.ppdbOtp.id, otp.id));
    throw new Error("Kode OTP salah. Periksa kembali kode yang diterima.");
  }

  await db
    .update(table.ppdbOtp)
    .set({ consumedAt: new Date() })
    .where(eq(table.ppdbOtp.id, otp.id));

  let [account] = await db
    .select()
    .from(table.ppdbAccount)
    .where(eq(table.ppdbAccount.phone, phone));

  if (!account) {
    [account] = await db
      .insert(table.ppdbAccount)
      .values({
        phone,
        fullName: otp.fullName?.trim() || "Wali Santri",
        phoneVerifiedAt: new Date()
      })
      .onConflictDoNothing({ target: table.ppdbAccount.phone })
      .returning();

    if (!account) {
      [account] = await db
        .select()
        .from(table.ppdbAccount)
        .where(eq(table.ppdbAccount.phone, phone));
    }
  }

  if (!account || !account.isActive) {
    throw new Error("Akun tidak aktif. Hubungi pengurus pondok.");
  }

  await db
    .update(table.ppdbAccount)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(table.ppdbAccount.id, account.id));

  await linkRegistrationsToAccount(account.id, phone);

  const token = generateAccountSessionToken();
  const session = await createAccountSession(token, account.id);

  return {
    account: {
      id: account.id,
      phone: account.phone,
      fullName: account.fullName
    },
    token,
    session
  };
}

export async function resendOtp(phoneInput: string): Promise<RequestOtpResult> {
  const phone = normalizePhoneOrThrow(phoneInput);

  const [last] = await db
    .select({ fullName: table.ppdbOtp.fullName })
    .from(table.ppdbOtp)
    .where(eq(table.ppdbOtp.phone, phone))
    .orderBy(desc(table.ppdbOtp.createdAt))
    .limit(1);

  return requestOtp({ phone, fullName: last?.fullName ?? null });
}
