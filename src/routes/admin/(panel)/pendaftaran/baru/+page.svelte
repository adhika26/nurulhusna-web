<script lang="ts">
  import { AlertTriangle, BookOpen, GraduationCap, Home } from "@lucide/svelte";
  import RegistrationWizard from "$lib/components/ppdb/RegistrationWizard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Pendaftaran Offline — Admin Nurul Husna</title></svelte:head>

{#if !data.wave}
  <div class="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200">
    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
      <AlertTriangle class="h-6 w-6" aria-hidden="true" />
    </div>
    <h1 class="mt-4 text-xl font-semibold text-stone-900">Belum ada gelombang yang dibuka</h1>
    <p class="mt-2 text-sm text-stone-600">
      Aktifkan gelombang dan sesuaikan tanggalnya, atau nyalakan mode uji coba di pengaturan,
      sebelum mencatat pendaftaran offline.
    </p>
    <div class="mt-5 flex flex-wrap justify-center gap-2">
      <a href="/admin/master/gelombang" class="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
        Kelola gelombang
      </a>
      <a href="/admin/pengaturan" class="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
        Buka pengaturan
      </a>
    </div>
  </div>
{:else if !data.category}
  <div class="mx-auto max-w-4xl">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <a href="/admin/pendaftaran" class="text-sm font-medium text-brand-700 hover:underline">← Daftar pendaftar</a>
        <h1 class="mt-2 text-2xl font-semibold text-stone-900">Pendaftaran Offline</h1>
        <p class="mt-1 text-sm text-stone-500">
          {data.wave.name} · {data.wave.academicYear}. Pilih kategori santri yang didaftarkan di asrama.
        </p>
      </div>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      {#each data.categories as category (category.code)}
        <a
          href="/admin/pendaftaran/baru?kategori={category.code}"
          class="rounded-2xl bg-white p-5 ring-1 ring-stone-200 hover:ring-brand-400"
        >
          <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            {#if category.educationLevel === "mi"}
              <BookOpen class="h-5 w-5" aria-hidden="true" />
            {:else if category.educationLevel === "mts"}
              <GraduationCap class="h-5 w-5" aria-hidden="true" />
            {:else}
              <Home class="h-5 w-5" aria-hidden="true" />
            {/if}
          </span>
          <p class="mt-3 text-xs font-semibold text-brand-700">{category.institutionName}</p>
          <h2 class="mt-1 text-lg font-semibold text-stone-900">{category.name}</h2>
          <p class="mt-1 text-sm text-stone-500">
            {category.gradeRange ? `Kelas ${category.gradeRange}` : "Tanpa sekolah formal"}
          </p>
        </a>
      {/each}
    </div>
  </div>
{:else}
  <RegistrationWizard
    category={data.category}
    academicYear={data.wave.academicYear}
    total={data.total}
    mode="offline"
    categoryHref="/admin/pendaftaran/baru"
    endpoint="/api/admin/ppdb/registrations"
  />
{/if}
