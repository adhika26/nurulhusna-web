<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import { formatDate } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const categoryLabel: Record<string, string> = {
    berita: "Berita",
    pengumuman: "Pengumuman"
  };

  const featured = $derived(data.posts[0] ?? null);
  const rest = $derived(data.posts.slice(1));
</script>

<svelte:head>
  <title>Berita dan Pengumuman | {data.site.name}</title>
  <meta
    name="description"
    content="Kabar dan pengumuman terbaru dari Pondok Pesantren Nurul Husna."
  />
</svelte:head>

<PageHeader
  title="Berita dan Pengumuman"
  lead="Kabar kegiatan dan informasi resmi dari pondok."
/>

<section class="mx-auto max-w-7xl px-4 py-12 sm:py-14">
  {#if !featured}
    <div class="max-w-2xl rounded-2xl border border-dashed border-stone-300 bg-white p-6">
      <p class="text-stone-600">Belum ada berita yang diterbitkan.</p>
    </div>
  {:else}
    <article class="grid gap-6 lg:grid-cols-2 lg:items-center">
      <a
        href="/berita/{featured.slug}"
        class="block overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200"
      >
        {#if featured.coverUrl}
          <img
            src={featured.coverUrl}
            alt={featured.title}
            width="1200"
            height="750"
            class="aspect-[16/10] h-full w-full object-cover"
          />
        {:else}
          <div class="arch-pattern flex aspect-[16/10] items-center justify-center bg-brand-800 px-6 text-center">
            <span class="max-w-sm text-lg font-bold text-white">{featured.title}</span>
          </div>
        {/if}
      </a>

      <div>
        <p class="text-xs font-bold tracking-wide text-brand-700 uppercase">
          {categoryLabel[featured.category] ?? featured.category}
        </p>
        <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          <a href="/berita/{featured.slug}" class="hover:text-brand-800">{featured.title}</a>
        </h2>
        <p class="mt-2 text-sm text-stone-500">
          <time datetime={featured.publishedAt?.toISOString()}>{formatDate(featured.publishedAt)}</time>
        </p>
        {#if featured.excerpt}
          <p class="mt-3 leading-relaxed text-stone-600">{featured.excerpt}</p>
        {/if}
        <a
          href="/berita/{featured.slug}"
          class="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800"
        >
          Baca berita
        </a>
      </div>
    </article>

    {#if rest.length > 0}
      <div class="mt-12 divide-y divide-stone-200 border-y border-stone-200">
        {#each rest as post (post.slug)}
          <article class="py-6">
            <a href="/berita/{post.slug}" class="group grid gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <div class="text-sm text-stone-500">
                <time datetime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
                <span class="mt-1 block text-xs font-bold tracking-wide text-brand-700 uppercase">
                  {categoryLabel[post.category] ?? post.category}
                </span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-stone-900 group-hover:text-brand-800">
                  {post.title}
                </h2>
                {#if post.excerpt}
                  <p class="mt-2 leading-relaxed text-stone-600">{post.excerpt}</p>
                {/if}
              </div>
            </a>
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</section>
