<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Fasilitas | {data.site.name}</title>
  <meta
    name="description"
    content="Fasilitas dan lingkungan Pondok Pesantren Nurul Husna, Selomerto, Wonosobo."
  />
</svelte:head>

<PageHeader
  title="Fasilitas"
  lead="Sarana yang menunjang kegiatan belajar dan kehidupan santri di pondok."
/>

<section class="mx-auto max-w-7xl px-4 py-12">
  {#if data.page}
    <article class="article max-w-3xl">
      {@html data.page.html}
    </article>
  {:else}
    <div class="max-w-3xl rounded-2xl border border-dashed border-stone-300 bg-white p-6">
      <p class="text-stone-600">Informasi fasilitas sedang dilengkapi pengurus.</p>
    </div>
  {/if}

  {#if data.gallery.length > 0}
    <div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {#each data.gallery as item (item.id)}
        {#if item.imageUrl}
          <figure class="overflow-hidden rounded-lg bg-stone-100">
            <div class="aspect-[4/3]">
              <img
                src={item.imageUrl}
                alt={item.title ?? "Foto fasilitas pondok"}
                width="800"
                height="600"
                loading="lazy"
                class="h-full w-full object-cover"
              />
            </div>
            {#if item.title}
              <figcaption class="px-3 py-2 text-xs text-stone-500">{item.title}</figcaption>
            {/if}
          </figure>
        {/if}
      {/each}
    </div>
  {/if}
</section>
