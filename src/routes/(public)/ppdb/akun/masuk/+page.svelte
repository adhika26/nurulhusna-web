<script lang="ts">
  import { MessageCircle, ShieldCheck } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Masuk atau Daftar Akun | PPDB</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-xl px-4 py-12">
  <div class="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
      <MessageCircle class="h-6 w-6" />
    </div>
    <h1 class="mt-4 text-2xl font-bold text-stone-900">Masuk atau buat akun</h1>
    <p class="mt-2 text-sm text-stone-600">
      Akun dipakai untuk mendaftarkan santri, melihat status, dan mengunggah bukti pembayaran.
      Kami akan mengirim kode OTP melalui WhatsApp.
    </p>

    {#if form?.message}
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
    {/if}

    <form method="POST" class="mt-5 space-y-4">
      <input type="hidden" name="next" value={data.next} />
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nomor WhatsApp</span>
        <input
          name="phone"
          type="tel"
          inputmode="tel"
          placeholder="08xxxxxxxxxx"
          value={form?.phone ?? ""}
          required
          autocomplete="tel"
          class="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
        />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nama lengkap wali</span>
        <input
          name="fullName"
          placeholder="Nama ayah, ibu, atau wali"
          value={form?.fullName ?? ""}
          required
          autocomplete="name"
          class="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
        />
      </label>
      <button
        type="submit"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        <ShieldCheck class="h-4 w-4" /> Kirim kode OTP
      </button>
    </form>

    <p class="mt-4 text-xs text-stone-500">
      Sudah pernah mendaftar? Masukkan nomor WhatsApp yang sama. Nama tidak akan mengubah akun lama.
    </p>
  </div>
</div>
