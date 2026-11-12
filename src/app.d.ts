// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: import("$lib/server/auth").SessionUser | null;
      session: import("$lib/server/auth").SessionData | null;
      ppdbAccount: import("$lib/server/ppdb/account-auth").AccountUser | null;
      ppdbAccountSession: import("$lib/server/ppdb/account-auth").AccountSessionData | null;
    }
  }
}

export {};
