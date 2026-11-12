import { createHmac, timingSafeEqual } from "node:crypto";

const secret = process.env.APP_SECRET;

if (!secret) {
  console.warn("[ppdb] APP_SECRET belum diset. Token akses memakai nilai sementara.");
}

export const appSecretKey = secret ?? "nurulhusna-development-secret";

export const accessCookieName = "ppdb-access";
export const ACCESS_DURATION_MS = 1000 * 60 * 60 * 4;

function sign(payload: string): string {
  return createHmac("sha256", appSecretKey).update(payload).digest("base64url");
}

export function createAccessToken(registrationId: string): string {
  const expiresAt = Date.now() + ACCESS_DURATION_MS;
  const payload = `${registrationId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAccessToken(token: string | undefined): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [registrationId, expiresAt, signature] = parts;
  const expected = sign(`${registrationId}.${expiresAt}`);

  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);

  if (provided.length !== wanted.length) return null;
  if (!timingSafeEqual(provided, wanted)) return null;
  if (Date.now() > Number(expiresAt)) return null;

  return registrationId;
}

export function normalizePhone(value: string | null | undefined): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = `0${digits.slice(2)}`;
  return digits;
}

export function toWhatsAppNumber(value: string): string {
  const phone = normalizePhone(value);
  return phone.startsWith("0") ? `62${phone.slice(1)}` : phone;
}
