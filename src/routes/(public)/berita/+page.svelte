<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import { formatDate } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const categoryLabel: Record<string, string> = {
    berita: "Berita",
    pengumuman: "Pengumuman"
  };
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

<section class="mx-auto max-w-7xl px-4 py-12">
  {#if data.posts.length === 0}
    <div class="max-w-2xl rounded-2xl border border-dashed border-stone-300 bg-white p-6">
      <p class="text-stone-600">Belum ada berita yang diterbitkan.</p>
    </div>
  {:else}
    <div class="divide-y divide-stone-200 border-y border-stone-200">
      {#each data.posts as post (post.slug)}
        <article class="py-6">
          <a href="/berita/{post.slug}" class="group grid gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
            <div class="text-sm text-stone-500">
              <time datetime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
              <span class="mt-1 block text-xs font-medium tracking-wide text-brand-700 uppercase">
                {categoryLabel[post.category] ?? post.category}
              </span>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-stone-900 group-hover:text-brand-800">
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
</section>
