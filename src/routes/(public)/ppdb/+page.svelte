<script lang="ts">
  import { BookOpen, GraduationCap, Home, Info } from "@lucide/svelte";
  import { formatRupiah, formatDate } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function period(opensAt: string | Date | null, closesAt: string | Date | null): string {
    if (!opensAt && !closesAt) return "Jadwal menyusul";
    if (opensAt && closesAt) return `${formatDate(opensAt)} – ${formatDate(closesAt)}`;
    if (opensAt) return `Mulai ${formatDate(opensAt)}`;
    return `Sampai ${formatDate(closesAt)}`;
  }
</script>

<svelte:head>
  <title>Pendaftaran Santri Baru | {data.site.name}</title>
  <meta
    name="description"
    content="Informasi kategori, biaya, dan formulir pendaftaran santri baru {data.site.name}."
  />
</svelte:head>

<section class="border-b border-stone-200 bg-white">
  <div class="mx-auto max-w-7xl px-4 py-12">
    <p class="text-sm font-medium uppercase tracking-wider text-brand-700">Penerimaan Santri Baru</p>
    <h1 class="mt-2 text-3xl font-bold text-stone-900 sm:text-4xl">
      Pendaftaran Santri Baru {data.wave ? data.wave.academicYear : ""}
    </h1>
    <p class="mt-3 max-w-2xl text-stone-600">
      {data.intro || "Pilih kategori santri yang sesuai untuk melihat rincian biaya dan mengisi formulir pendaftaran."}
    </p>
    {#if data.wave}
      <p class="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
        <span class="font-semibold">{data.wave.name}</span>
        <span class="text-brand-700">{period(data.wave.opensAt, data.wave.closesAt)}</span>
      </p>
      {#if data.forced}
        <p class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Mode uji coba: pendaftaran dibuka di luar jadwal gelombang. Matikan lewat
          Admin → Pengaturan saat sudah siap live.
        </p>
      {/if}
    {/if}
  </div>
</section>

<section class="mx-auto max-w-7xl px-4 py-10">
  <div class="flex items-center justify-between gap-3">
    <h2 class="text-lg font-semibold text-stone-900">Pilih kategori santri</h2>
    {#if data.wave}
      <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        {data.wave.name}
      </span>
    {/if}
  </div>

  {#if !data.wave}
    <div class="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <Info class="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {#if data.upcoming}
          <p class="font-medium">Pendaftaran belum dibuka.</p>
          <p class="mt-1">
            {data.upcoming.name} dijadwalkan {period(data.upcoming.opensAt, data.upcoming.closesAt)}.
          </p>
        {:else}
          <p class="font-medium">Pendaftaran sedang ditutup.</p>
          <p class="mt-1">Silakan hubungi pengurus pondok untuk informasi gelombang berikutnya.</p>
        {/if}
      </div>
    </div>
  {/if}

  <div class="mt-5 grid gap-4 sm:grid-cols-2">
    {#each data.categories as category (category.id)}
      <div class="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <div class="flex items-start justify-between gap-3">
          <div>
            <span class="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-stone-600">
              {category.code}
            </span>
            <h3 class="mt-2 text-lg font-semibold text-stone-900">{category.name}</h3>
            <p class="text-sm text-stone-500">{category.institutionName}{category.gradeRange ? ` · kelas ${category.gradeRange}` : ""}</p>
          </div>
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            {#if category.educationLevel === "mi"}
              <BookOpen class="h-5 w-5" aria-hidden="true" />
            {:else if category.educationLevel === "mts"}
              <GraduationCap class="h-5 w-5" aria-hidden="true" />
            {:else}
              <Home class="h-5 w-5" aria-hidden="true" />
            {/if}
          </span>
        </div>

        {#if category.description}
          <p class="mt-3 text-sm text-stone-600">{category.description}</p>
        {/if}

        <div class="mt-4 border-t border-stone-100 pt-4">
          <p class="text-xs text-stone-500">Total biaya pendaftaran</p>
          <p class="mt-1 text-2xl font-semibold text-stone-900">
            {#if data.totals[category.id] !== null}
              {formatRupiah(data.totals[category.id])}
            {:else}
              <span class="text-base font-normal text-stone-500">Menyusul</span>
            {/if}
          </p>
          <p class="mt-1 text-xs text-stone-600">Dapat dibayar lunas atau dicicil 3×.</p>
        </div>

        <a
          href="/ppdb/daftar?kategori={category.code}"
          class="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 {data.wave
            ? ''
            : 'pointer-events-none opacity-40'}"
        >
          Daftar kategori ini
        </a>
      </div>
    {/each}
  </div>
</section>

<section class="mx-auto max-w-7xl px-4 pb-4">
  <div class="rounded-2xl border border-stone-200 bg-white p-6">
    <h2 class="font-semibold text-stone-900">Alur pendaftaran</h2>
    <ol class="mt-4 grid gap-4 sm:grid-cols-4">
      {#each [
        "Pilih kategori santri",
        "Isi formulir identitas",
        "Dapatkan kode pendaftaran",
        "Bayar lunas atau cicil 3×"
      ] as step, index (step)}
        <li class="rounded-2xl bg-stone-50 p-4">
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <p class="mt-2 text-sm font-medium text-stone-800">{step}</p>
        </li>
      {/each}
    </ol>
    <p class="mt-4 text-sm text-stone-500">
      Pendaftaran juga dapat dilakukan langsung di asrama dan akan diinput oleh pengurus.
    </p>
  </div>
</section>
