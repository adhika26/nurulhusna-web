<script lang="ts">
  import { enhance } from "$app/forms";
  import { Library } from "@lucide/svelte";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Masuk Admin | Pondok Pesantren Nurul Husna</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-stone-100 px-4">
  <div class="w-full max-w-sm">
    <div class="mb-8 text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white">
        <Library class="h-7 w-7" />
      </div>
      <h1 class="mt-4 text-xl font-semibold text-stone-900">Pondok Pesantren Nurul Husna</h1>
      <p class="text-sm text-stone-500">Panel administrasi</p>
    </div>

    <form method="POST" class="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      {#if form?.message}
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
      {/if}

      <div>
        <label for="username" class="mb-1 block text-sm font-medium text-stone-700">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autocomplete="username"
          required
          value={form?.username ?? ""}
          class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label for="password" class="mb-1 block text-sm font-medium text-stone-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <button
        type="submit"
        class="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Masuk
      </button>
    </form>

    <p class="mt-6 text-center text-xs text-stone-400">
      Halaman ini hanya untuk pengurus pondok.
    </p>
  </div>
</main>
