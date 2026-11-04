<script lang="ts">
  let { title, lead = "" }: { title: string; lead?: string } = $props();
</script>

<header class="border-b border-stone-100 bg-brand-50">
  <div class="mx-auto max-w-7xl px-4 py-12 sm:py-16">
    <h1 class="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">{title}</h1>
    {#if lead}
      <p class="mt-3 max-w-2xl text-lg leading-relaxed text-stone-600">{lead}</p>
    {/if}
  </div>
</header>
