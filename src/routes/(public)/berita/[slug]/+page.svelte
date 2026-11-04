<script lang="ts">
  import { formatDate } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const categoryLabel: Record<string, string> = {
    berita: "Berita",
    pengumuman: "Pengumuman"
  };
</script>

<svelte:head>
  <title>{data.post.title} | {data.site.name}</title>
  <meta name="description" content={data.post.excerpt ?? data.post.title} />
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-12">
  <a href="/berita" class="text-sm font-medium text-brand-700 hover:text-brand-900">
    Kembali ke berita
  </a>

  <header class="mt-4">
    <p class="text-xs font-medium tracking-wide text-brand-700 uppercase">
      {categoryLabel[data.post.category] ?? data.post.category}
    </p>
    <h1 class="mt-2 font-serif text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
      {data.post.title}
    </h1>
    <p class="mt-3 text-sm text-stone-500">
      <time datetime={data.post.publishedAt?.toISOString()}>{formatDate(data.post.publishedAt)}</time>
    </p>
  </header>

  {#if data.post.coverUrl}
    <div class="mt-6 aspect-[16/9] overflow-hidden rounded-lg bg-stone-100">
      <img
        src={data.post.coverUrl}
        alt={data.post.title}
        width="1200"
        height="675"
        class="h-full w-full object-cover"
      />
    </div>
  {/if}

  <div class="article mt-8">
    {@html data.post.html}
  </div>
</article>
