<script lang="ts">
  import { Construction } from "@lucide/svelte";
</script>

<svelte:head><title>Pendaftaran Offline | Admin Nurul Husna</title></svelte:head>

<div class="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200">
  <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
    <Construction class="h-6 w-6" />
  </div>
  <h1 class="mt-4 text-xl font-semibold text-stone-900">Input pendaftaran offline</h1>
  <p class="mt-2 text-sm text-stone-600">
    Formulir input di asrama sedang disiapkan pada tahap berikutnya. Sementara ini pendaftaran
    offline dapat dicatat melalui pendaftaran online dengan didampingi pengurus.
  </p>
  <a href="/admin/pendaftaran" class="mt-5 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
    Kembali ke daftar pendaftar
  </a>
</div>
