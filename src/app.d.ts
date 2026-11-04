// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: import("$lib/server/auth").SessionUser | null;
      session: import("$lib/server/auth").SessionData | null;
    }
  }
}

export {};
