<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Galeri | {data.site.name}</title>
  <meta
    name="description"
    content="Foto kegiatan dan lingkungan Pondok Pesantren Nurul Husna."
  />
</svelte:head>

<PageHeader
  title="Galeri"
  lead="Suasana kegiatan dan lingkungan pondok."
/>

<section class="mx-auto max-w-7xl px-4 py-12">
  {#if data.gallery.length === 0}
    <div class="max-w-2xl rounded-2xl border border-dashed border-stone-300 bg-white p-6">
      <p class="text-stone-600">Belum ada foto yang dipublikasikan.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.gallery as item (item.id)}
        {#if item.imageUrl}
          <figure class="overflow-hidden rounded-lg bg-white ring-1 ring-stone-200">
            <div class="aspect-[4/3] bg-stone-100">
              <img
                src={item.imageUrl}
                alt={item.title ?? "Foto kegiatan pondok"}
                width="800"
                height="600"
                loading="lazy"
                class="h-full w-full object-cover"
              />
            </div>
            {#if item.title || item.description}
              <figcaption class="px-4 py-3">
                {#if item.title}
                  <p class="text-sm font-medium text-stone-900">{item.title}</p>
                {/if}
                {#if item.description}
                  <p class="mt-1 text-xs leading-relaxed text-stone-500">{item.description}</p>
                {/if}
              </figcaption>
            {/if}
          </figure>
        {/if}
      {/each}
    </div>
  {/if}
</section>
