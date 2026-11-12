<script lang="ts">
  import { KeyRound, Phone, Search } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Cek Status Pendaftaran | {data.site.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-md px-4 py-14">
  <div class="text-center">
    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
      <Search class="h-6 w-6" />
    </div>
    <h1 class="mt-4 text-2xl font-bold text-stone-900">Cek Status Pendaftaran</h1>
    <p class="mt-1 text-sm text-stone-600">
      Masukkan kode pendaftaran dan salah satu nomor HP yang didaftarkan.
    </p>
  </div>

  <form method="POST" class="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
    {#if form?.message}
      <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
    {/if}

    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Kode pendaftaran</span>
      <div class="flex items-center gap-2 rounded-lg border border-stone-300 px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
        <KeyRound class="h-4 w-4 text-stone-600" />
        <input
          name="kode"
          value={form && "kode" in form && form.kode ? form.kode : data.kode}
          placeholder="NH-482913"
          required
          class="w-full bg-transparent py-2 font-mono text-sm outline-none"
        />
      </div>
    </label>

    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Nomor HP</span>
      <div class="flex items-center gap-2 rounded-lg border border-stone-300 px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
        <Phone class="h-4 w-4 text-stone-600" />
        <input
          name="phone"
          inputmode="tel"
          placeholder="08xxxxxxxxxx"
          required
          class="w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>
    </label>

    <button
      type="submit"
      class="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
    >
      Lihat status
    </button>
  </form>

  <p class="mt-4 text-center text-xs text-stone-600">
    Gunakan nomor HP santri, ayah, atau ibu yang diisi saat pendaftaran.
  </p>
</div>
