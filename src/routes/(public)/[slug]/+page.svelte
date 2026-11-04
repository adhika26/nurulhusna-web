<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.page.title} | {data.site.name}</title>
  <meta name="description" content={data.page.title} />
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-12">
  <h1 class="font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">{data.page.title}</h1>
  <div class="article mt-6">
    {@html data.page.html}
  </div>
</article>
