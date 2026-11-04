<script lang="ts">
  import { Save } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Pengaturan | Admin Nurul Husna</title></svelte:head>

<h1 class="text-2xl font-semibold text-stone-900">Pengaturan</h1>
<p class="mt-1 text-sm text-stone-500">
  Informasi ini tampil di halaman publik dan halaman pembayaran.
</p>

{#if form?.message}
  <p
    class="mt-4 rounded-lg px-3 py-2 text-sm {form.success
      ? 'bg-brand-50 text-brand-800'
      : 'bg-red-50 text-red-700'}"
  >
    {form.message}
  </p>
{/if}

<form method="POST" class="mt-6 space-y-5">
  <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Identitas Pondok</h2>
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nama pondok</span>
        <input name="site_name" value={data.settings.site_name ?? ""} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Tagline</span>
        <input name="site_tagline" value={data.settings.site_tagline ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Alamat</span>
        <input name="site_address" value={data.settings.site_address ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Telepon / WhatsApp</span>
        <input name="site_phone" value={data.settings.site_phone ?? ""} placeholder="08xx" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Email</span>
        <input name="site_email" type="email" value={data.settings.site_email ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
    </div>
  </section>

  <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Rekening Pembayaran</h2>
    <p class="mt-1 text-sm text-stone-500">Ditampilkan pada halaman tagihan santri.</p>
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nama bank</span>
        <input name="bank_name" value={data.settings.bank_name ?? ""} placeholder="contoh: Bank Syariah Indonesia" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nomor rekening</span>
        <input name="bank_account_number" value={data.settings.bank_account_number ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Atas nama</span>
        <input name="bank_account_name" value={data.settings.bank_account_name ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
    </div>
  </section>

  <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Teks Halaman PPDB</h2>
    <label class="mt-4 block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Pengantar singkat</span>
      <textarea name="ppdb_intro" rows="3" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">{data.settings.ppdb_intro ?? ""}</textarea>
    </label>
  </section>

  <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Mode Pengembangan</h2>
    <p class="mt-1 text-sm text-stone-500">
      Untuk uji coba sebelum jadwal gelombang dimulai.
    </p>
    <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
      <input
        type="checkbox"
        name="ppdb_force_open"
        checked={data.settings.ppdb_force_open === "1"}
        class="mt-0.5 rounded"
      />
      <span>
        <span class="block text-sm font-medium text-stone-800">Buka pendaftaran di luar jadwal gelombang</span>
        <span class="mt-0.5 block text-xs text-stone-500">
          Jika dicentang, formulir tetap bisa diisi walau tanggal gelombang belum dimulai.
          Matikan saat website sudah live.
        </span>
      </span>
    </label>
  </section>

  <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
    <Save class="h-4 w-4" /> Simpan pengaturan
  </button>
</form>
