<script lang="ts">
  import PageHeader from "$lib/components/public/PageHeader.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Profil Pondok | {data.site.name}</title>
  <meta
    name="description"
    content="Profil Pondok Pesantren Nurul Husna di Selomerto, Wonosobo: lembaga pendidikan dan pilihan santri."
  />
</svelte:head>

<PageHeader
  title="Profil Pondok"
  lead="Pondok Pesantren Nurul Husna berada di Selomerto, Wonosobo, dan menaungi pendidikan formal MI serta MTs di bawah Yayasan Nurul Husna."
/>

<section class="mx-auto max-w-7xl px-4 py-12 sm:py-14">
  <div class="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
    <div>
      {#if data.page}
        <article class="article">
          {@html data.page.html}
        </article>
      {:else}
        <div class="rounded-2xl border border-dashed border-stone-300 bg-white p-6">
          <p class="text-stone-600">
            Informasi profil pondok sedang dilengkapi pengurus. Silakan kembali lagi nanti.
          </p>
        </div>
      {/if}
    </div>

    <aside class="space-y-6">
      <div class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 class="font-serif text-lg font-semibold text-stone-900">Alamat</h2>
        <p class="mt-2 text-sm leading-relaxed text-stone-600">{data.site.address}</p>
      </div>

      <div class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 class="font-serif text-lg font-semibold text-stone-900">Lembaga</h2>
        <ul class="mt-2 space-y-1 text-sm text-stone-600">
          <li>MI Nurul Chusna</li>
          <li>MTs. Nurul Chusna</li>
          <li>Program mondok</li>
        </ul>
      </div>

      <div class="rounded-2xl bg-brand-900 p-5 text-white">
        <h2 class="font-serif text-lg font-semibold">Mendaftar santri baru</h2>
        <p class="mt-1 text-sm text-brand-100">Lihat jadwal gelombang dan kategori santri.</p>
        <a
          href="/ppdb"
          class="mt-3 inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Buka halaman pendaftaran
        </a>
      </div>
    </aside>
  </div>
</section>
