<script lang="ts">
  import RegistrationWizard from "$lib/components/ppdb/RegistrationWizard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Perbaiki Data {data.code} | PPDB</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-8">
  <a href="/ppdb/akun" class="text-sm font-medium text-brand-700 hover:underline">
    ← Kembali ke akun
  </a>
  <h1 class="mt-2 text-2xl font-bold text-stone-900">Perbaiki Data Pendaftaran</h1>
  <p class="mt-1 text-sm text-stone-500">
    Kode pendaftaran <span class="font-mono">{data.code}</span>.
  </p>

  {#if data.revisionNote}
    <div class="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
      Catatan dari pengurus: {data.revisionNote}
    </div>
  {/if}

  {#if data.existingDocuments > 0}
    <p class="mt-3 text-xs text-stone-500">
      Anda sudah mengunggah {data.existingDocuments} berkas. Berkas lama tetap tersimpan. Unggah berkas baru hanya jika ingin menggantinya.
    </p>
  {/if}
</div>

<RegistrationWizard
  category={data.category}
  academicYear={data.academicYear}
  total={data.total}
  initialDraft={data.initialDraft}
  editMode={true}
  categoryHref="/ppdb/akun"
  endpoint={`/api/ppdb/registrations/${data.registrationId}`}
  successHref="/ppdb/akun"
/>
