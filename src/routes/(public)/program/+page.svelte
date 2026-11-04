<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import { BookOpen, GraduationCap, Home } from "@lucide/svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Program Pendidikan | {data.site.name}</title>
  <meta
    name="description"
    content="Pilihan program Pondok Pesantren Nurul Husna: mondok dengan MI, mondok dengan MTs, atau mondok saja."
  />
</svelte:head>

<PageHeader
  title="Program Pendidikan"
  lead="Santri dapat memilih mondok sambil menempuh pendidikan formal, atau mondok saja dengan pembinaan di pondok."
/>

<section class="mx-auto max-w-7xl px-4 py-12 sm:py-14">
  {#if data.page}
    <article class="article max-w-3xl">
      {@html data.page.html}
    </article>
  {/if}

  <div class="mt-12">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="max-w-2xl">
        <h2 class="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Empat pilihan pendaftaran
        </h2>
        <p class="mt-2 text-stone-600">
          Setiap pilihan punya lembaga dan jenjang yang berbeda. Rincian biaya mengikuti kategori
          yang dipilih.
        </p>
      </div>
      <a
        href="/ppdb"
        class="inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800"
      >
        Lihat jadwal dan biaya
      </a>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      {#each data.categories as category (category.code)}
        <div class="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <div class="flex items-center justify-between gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              {#if category.educationLevel === "mi"}
                <BookOpen class="h-5 w-5" aria-hidden="true" />
              {:else if category.educationLevel === "mts"}
                <GraduationCap class="h-5 w-5" aria-hidden="true" />
              {:else}
                <Home class="h-5 w-5" aria-hidden="true" />
              {/if}
            </span>
            <span class="text-[11px] font-semibold text-stone-500">{category.institutionName}</span>
          </div>

          <h3 class="mt-4 text-lg font-bold text-stone-900">{category.name}</h3>
          <p class="mt-1 text-sm text-stone-500">
            {category.gradeRange ? `Kelas ${category.gradeRange}` : "Tanpa sekolah formal"}
          </p>
          <p class="mt-3 text-sm leading-relaxed text-stone-600">
            {category.description ?? "Informasi program sedang dilengkapi."}
          </p>
          <a
            href="/ppdb"
            class="mt-4 inline-block text-sm font-bold text-brand-700 hover:text-brand-900"
          >
            Lihat biaya dan daftar
          </a>
        </div>
      {/each}
    </div>
  </div>
</section>
