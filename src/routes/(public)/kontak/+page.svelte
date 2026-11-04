<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import { MapPin, Phone, Mail } from "@lucide/svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const mapsUrl = $derived(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.site.address)}`
  );
</script>

<svelte:head>
  <title>Kontak | {data.site.name}</title>
  <meta
    name="description"
    content="Alamat dan kontak Pondok Pesantren Nurul Husna, Jl. Balekambang Km.01, Selomerto, Wonosobo."
  />
</svelte:head>

<PageHeader
  title="Kontak"
  lead="Silakan datang langsung atau hubungi pengurus pondok pada jam kerja."
/>

<section class="mx-auto max-w-7xl px-4 py-12">
  <div class="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
    <div class="space-y-6">
      <div class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 class="font-serif text-lg font-semibold text-stone-900">Alamat</h2>
        <p class="mt-2 flex items-start gap-2 text-sm leading-relaxed text-stone-600">
          <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
          <span>{data.site.address}</span>
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-block text-sm font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
        >
          Buka di Google Maps
        </a>
      </div>

      <div class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 class="font-serif text-lg font-semibold text-stone-900">Hubungi</h2>
        <div class="mt-2 space-y-2 text-sm text-stone-600">
          {#if data.site.phone}
            <p class="flex items-center gap-2">
              <Phone class="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
              <a href="tel:{data.site.phone}" class="hover:text-stone-900">{data.site.phone}</a>
            </p>
          {/if}
          {#if data.site.email}
            <p class="flex items-center gap-2">
              <Mail class="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
              <a href="mailto:{data.site.email}" class="hover:text-stone-900">{data.site.email}</a>
            </p>
          {/if}
          {#if !data.site.phone && !data.site.email}
            <p>Nomor telepon dan email belum dicantumkan. Silakan datang langsung ke alamat pondok.</p>
          {/if}
        </div>
      </div>
    </div>

    <div>
      {#if data.page}
        <article class="article">
          {@html data.page.html}
        </article>
      {/if}
    </div>
  </div>
</section>
