<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import SocialLinks from "$lib/components/public/SocialLinks.svelte";
  import { MapPin, Phone, Mail, Share2, ExternalLink } from "@lucide/svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const mapsQuery = $derived(
    data.site.coordinates.latitude && data.site.coordinates.longitude
      ? `${data.site.coordinates.latitude},${data.site.coordinates.longitude}`
      : data.site.address
  );

  const mapsUrl = $derived(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
  );

  const mapsEmbedUrl = $derived(
    data.site.coordinates.latitude && data.site.coordinates.longitude
      ? `https://www.google.com/maps?q=${data.site.coordinates.latitude},${data.site.coordinates.longitude}&z=16&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(data.site.address)}&z=16&output=embed`
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
  lead="Alamat, kontak, dan lokasi pondok di Selomerto, Wonosobo."
/>

<section class="mx-auto max-w-7xl px-4 py-10 sm:py-12">
  {#if data.page}
    <div class="article max-w-3xl">
      {@html data.page.html}
    </div>
  {/if}

  <div class="mt-8 grid gap-4 md:grid-cols-3">
    <div class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <MapPin class="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 class="mt-3 text-base font-bold text-stone-900">Alamat</h2>
      <p class="mt-1 text-sm leading-relaxed text-stone-600">{data.site.address}</p>
    </div>

    <div class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Phone class="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 class="mt-3 text-base font-bold text-stone-900">Hubungi</h2>
      <div class="mt-1 space-y-1.5 text-sm text-stone-600">
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

    <div class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Share2 class="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 class="mt-3 text-base font-bold text-stone-900">Media Sosial</h2>
      <div class="mt-3">
        <SocialLinks links={data.site.socials} variant="light" />
      </div>
    </div>
  </div>
</section>

<section class="bg-brand-900">
  <div class="mx-auto max-w-7xl px-4 py-14">
    <h2 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Lokasi Kami</h2>
    <span class="mt-3 block h-1 w-12 rounded-full bg-brand-300" aria-hidden="true"></span>

    <div class="relative mt-6 overflow-hidden rounded-2xl bg-brand-100 ring-1 ring-white/10">
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="absolute top-4 left-4 z-10 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50"
      >
        Buka di Maps
        <ExternalLink class="h-4 w-4" aria-hidden="true" />
      </a>
      <div class="absolute top-4 right-4 z-10 hidden max-w-[260px] rounded-xl bg-white/95 px-4 py-3 shadow-sm ring-1 ring-black/5 sm:block">
        <p class="text-sm font-bold text-stone-900">{data.site.name}</p>
        <p class="mt-0.5 text-xs leading-relaxed text-stone-600">{data.site.address}</p>
      </div>
      <iframe
        src={mapsEmbedUrl}
        title="Lokasi Pondok Pesantren Nurul Husna"
        width="1200"
        height="500"
        referrerpolicy="no-referrer-when-downgrade"
        class="h-[320px] w-full sm:h-[440px]"
      ></iframe>
    </div>
  </div>
</section>
