import { toWhatsAppNumber } from "./access";

type Provider = "log" | "fonnte" | "wablas" | "meta";

function provider(): Provider {
  const value = (process.env.WA_PROVIDER ?? "log").toLowerCase();
  if (value === "fonnte" || value === "wablas" || value === "meta") return value;
  return "log";
}

function otpMessage(code: string): string {
  return [
    "Kode OTP Pendaftaran Santri Baru Pondok Pesantren Nurul Husna:",
    code,
    "Berlaku 5 menit. Jangan berikan kode ini kepada siapa pun."
  ].join("\n");
}

async function postForm(url: string, token: string, values: Record<string, string>): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(values),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new Error(`Gagal mengirim WhatsApp (${response.status}).`);
  }
}

async function sendFonnte(phone: string, text: string): Promise<void> {
  const token = process.env.WA_API_KEY;
  if (!token) throw new Error("WA_API_KEY belum diset untuk Fonnte.");

  await postForm(
    process.env.WA_API_URL || "https://api.fonnte.com/send",
    token,
    {
      target: phone,
      message: text,
      countryCode: "62"
    }
  );
}

async function sendWablas(phone: string, text: string): Promise<void> {
  const token = process.env.WA_API_KEY;
  if (!token) throw new Error("WA_API_KEY belum diset untuk Wablas.");

  await postForm(
    process.env.WA_API_URL || "https://solo.wablas.com/api/send-message",
    token,
    {
      phone,
      message: text
    }
  );
}

async function sendMetaText(phone: string, text: string): Promise<void> {
  const token = process.env.WA_API_KEY;
  const phoneNumberId = process.env.WA_SENDER;

  if (!token || !phoneNumberId) {
    throw new Error("WA_API_KEY dan WA_SENDER wajib diset untuk Meta.");
  }

  const response = await fetch(
    process.env.WA_API_URL || `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text }
      }),
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) {
    throw new Error(`Gagal mengirim WhatsApp (${response.status}).`);
  }
}

async function sendMetaOtp(phone: string, code: string): Promise<void> {
  const token = process.env.WA_API_KEY;
  const phoneNumberId = process.env.WA_SENDER;
  const template = process.env.WA_TEMPLATE_OTP;

  if (!token || !phoneNumberId || !template) {
    throw new Error("WA_API_KEY, WA_SENDER, dan WA_TEMPLATE_OTP wajib diset untuk Meta.");
  }

  const response = await fetch(
    process.env.WA_API_URL || `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WA_TEMPLATE_LANG || "id" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }]
            }
          ]
        }
      }),
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) {
    throw new Error(`Gagal mengirim WhatsApp (${response.status}).`);
  }
}

export async function sendOtpMessage(phoneInput: string, code: string): Promise<void> {
  const phone = toWhatsAppNumber(phoneInput);
  const mode = provider();

  if (mode === "log") {
    console.log(`[otp] ${phone} -> ${code}`);
    return;
  }

  if (mode === "fonnte") return sendFonnte(phone, otpMessage(code));
  if (mode === "wablas") return sendWablas(phone, otpMessage(code));
  return sendMetaOtp(phone, code);
}

export async function sendWhatsAppMessage(
  phoneInput: string,
  text: string
): Promise<void> {
  if (process.env.WA_NOTIFY === "0") return;

  const phone = toWhatsAppNumber(phoneInput);
  const mode = provider();

  if (mode === "log") {
    console.log(`[wa] ${phone} -> ${text}`);
    return;
  }

  if (mode === "fonnte") return sendFonnte(phone, text);
  if (mode === "wablas") return sendWablas(phone, text);
  return sendMetaText(phone, text);
}

export function isOtpDevMode(): boolean {
  return process.env.OTP_DEV_MODE === "1";
}
