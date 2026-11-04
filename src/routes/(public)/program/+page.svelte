<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
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

<section class="mx-auto max-w-7xl px-4 py-12">
  {#if data.page}
    <article class="article max-w-3xl">
      {@html data.page.html}
    </article>
  {/if}

  <div class="mt-10">
    <h2 class="font-serif text-2xl font-semibold text-stone-900">Empat pilihan pendaftaran</h2>

    <ul class="mt-6 divide-y divide-stone-200 border-y border-stone-200">
      {#each data.categories as category, index (category.code)}
        <li class="grid gap-3 py-6 sm:grid-cols-[3rem_1.1fr_1fr] sm:gap-6">
          <span class="font-serif text-lg text-stone-600">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3 class="text-lg font-semibold text-stone-900">{category.name}</h3>
            <p class="mt-1 text-sm text-stone-500">
              {category.institutionName}{category.gradeRange ? `, kelas ${category.gradeRange}` : ""}
            </p>
          </div>
          <div class="text-sm leading-relaxed text-stone-600">
            {category.description ?? "Informasi program sedang dilengkapi."}
            <a
              href="/ppdb"
              class="mt-2 block font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
            >
              Lihat biaya dan daftar
            </a>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</section>
