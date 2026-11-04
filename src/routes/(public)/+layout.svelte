<script lang="ts">
  import { page } from "$app/state";
  import { Menu, X, MapPin, Phone, Mail, ExternalLink } from "@lucide/svelte";
  import SocialLinks from "$lib/components/public/SocialLinks.svelte";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: import("svelte").Snippet } = $props();

  let open = $state(false);
  let menuButton = $state<HTMLButtonElement | null>(null);

  const nav = [
    { href: "/", label: "Beranda" },
    { href: "/profil", label: "Profil" },
    { href: "/program", label: "Program" },
    { href: "/fasilitas", label: "Fasilitas" },
    { href: "/galeri", label: "Galeri" },
    { href: "/berita", label: "Berita" },
    { href: "/kontak", label: "Kontak" }
  ];

  const quickLinks = nav;

  function isActive(href: string): boolean {
    return href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href);
  }

  function closeMenu() {
    open = false;
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      open = false;
      menuButton?.focus();
    }
  }

  const mapsQuery = $derived(
    data.site.coordinates.latitude && data.site.coordinates.longitude
      ? `${data.site.coordinates.latitude},${data.site.coordinates.longitude}`
      : data.site.address
  );

  const mapsUrl = $derived(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
  );

  const mapsEmbedUrl = $derived(
    `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&z=16&output=embed`
  );
</script>

<svelte:window onkeydown={handleEscape} />

<div class="flex min-h-screen flex-col">
  <header class="sticky top-0 z-30 border-b border-stone-100 bg-white">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
      <a href="/" class="flex items-center gap-3" onclick={closeMenu}>
        <img
          src="/logo-nurul-husna.png"
          alt="Logo Pondok Pesantren Nurul Husna"
          width="44"
          height="44"
          class="h-11 w-11 object-contain"
        />
        <span class="leading-tight">
          <span class="block text-[15px] font-extrabold tracking-tight text-stone-900">Nurul Husna</span>
          <span class="block text-[11px] font-medium text-stone-500">Pondok Pesantren</span>
        </span>
      </a>

      <nav class="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama">
        {#each nav as item (item.href)}
          <a
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            class="text-sm font-semibold transition {isActive(item.href)
              ? 'text-brand-700'
              : 'text-stone-600 hover:text-brand-700'}"
          >
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="flex items-center gap-2">
        <a
          href="/ppdb"
          class="hidden rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800 sm:inline-flex"
        >
          Daftar Santri
        </a>
        <button
          type="button"
          bind:this={menuButton}
          onclick={() => (open = !open)}
          aria-expanded={open}
          aria-controls="menu-utama"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          class="inline-flex h-11 w-11 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100 lg:hidden"
        >
          {#if open}
            <X class="h-5 w-5" aria-hidden="true" />
          {:else}
            <Menu class="h-5 w-5" aria-hidden="true" />
          {/if}
        </button>
      </div>
    </div>

    {#if open}
      <div id="menu-utama" class="border-t border-stone-100 bg-white lg:hidden">
        <nav class="mx-auto grid max-w-7xl gap-1 px-4 py-3" aria-label="Navigasi utama (seluler)">
          {#each nav as item (item.href)}
            <a
              href={item.href}
              onclick={closeMenu}
              aria-current={isActive(item.href) ? "page" : undefined}
              class="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold {isActive(item.href)
                ? 'bg-brand-50 text-brand-800'
                : 'text-stone-700 hover:bg-stone-50'}"
            >
              {item.label}
            </a>
          {/each}
          <a
            href="/ppdb"
            onclick={closeMenu}
            class="mt-1 flex min-h-11 items-center justify-center rounded-full bg-brand-700 px-4 text-sm font-bold text-white sm:hidden"
          >
            Daftar Santri
          </a>
        </nav>
      </div>
    {/if}
  </header>

  <main class="flex-1">
    {@render children()}
  </main>

  <footer class="px-4 pt-4 pb-6">
    <div class="mx-auto max-w-7xl rounded-[2rem] bg-brand-900 px-6 py-10 text-brand-100 sm:px-10">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.55fr_0.85fr_0.85fr_1.25fr] lg:gap-10">
        <div>
          <div class="flex items-center gap-3">
            <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white p-1.5">
              <img
                src="/logo-nurul-husna.png"
                alt="Logo Pondok Pesantren Nurul Husna"
                width="48"
                height="48"
                class="h-full w-full object-contain"
              />
            </span>
            <div class="leading-tight">
              <p class="text-base font-extrabold text-white">Nurul Husna</p>
              <p class="text-xs text-brand-200">Pondok Pesantren</p>
            </div>
          </div>

          <p class="mt-4 max-w-sm text-sm leading-relaxed text-brand-100">
            Pondok Pesantren Nurul Husna menaungi MI Nurul Chusna, MTs. Nurul Chusna, dan program
            mondok di Selomerto, Wonosobo.
          </p>

          <div class="mt-5">
            <SocialLinks links={data.site.socials} />
          </div>
        </div>

        <div>
          <h2 class="text-[11px] font-bold tracking-[0.14em] text-brand-300 uppercase">Quick Links</h2>
          <ul class="mt-4 space-y-2.5 text-sm">
            {#each quickLinks as item (item.href)}
              <li>
                <a href={item.href} class="hover:text-white">{item.label}</a>
              </li>
            {/each}
          </ul>
        </div>

        <div>
          <h2 class="text-[11px] font-bold tracking-[0.14em] text-brand-300 uppercase">Pendaftaran</h2>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li><a href="/ppdb" class="hover:text-white">Daftar Santri</a></li>
            <li><a href="/ppdb/status" class="hover:text-white">Cek Status</a></li>
            <li><a href="/program" class="hover:text-white">Program Pendidikan</a></li>
            <li><a href="/profil" class="hover:text-white">Profil Pondok</a></li>
          </ul>
        </div>

        <div>
          <h2 class="text-[11px] font-bold tracking-[0.14em] text-brand-300 uppercase">Kontak</h2>
          <ul class="mt-4 space-y-3 text-sm">
            <li class="flex items-start gap-2">
              <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
              <span>{data.site.address}</span>
            </li>
            {#if data.site.phone}
              <li class="flex items-center gap-2">
                <Phone class="h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                <a href="tel:{data.site.phone}" class="hover:text-white">{data.site.phone}</a>
              </li>
            {/if}
            {#if data.site.email}
              <li class="flex items-center gap-2">
                <Mail class="h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                <a href="mailto:{data.site.email}" class="hover:text-white">{data.site.email}</a>
              </li>
            {/if}
          </ul>

          <div class="relative mt-4 overflow-hidden rounded-xl bg-brand-100 ring-1 ring-white/10">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-800 shadow-sm hover:bg-brand-50"
            >
              Buka di Maps
              <ExternalLink class="h-3 w-3" aria-hidden="true" />
            </a>
            <iframe
              src={mapsEmbedUrl}
              title="Lokasi Pondok Pesantren Nurul Husna"
              width="400"
              height="220"
              referrerpolicy="no-referrer-when-downgrade"
              class="h-44 w-full bg-brand-100"
            ></iframe>
          </div>
        </div>
      </div>

      <div class="mt-10 border-t border-white/10 pt-5">
        <p class="text-xs text-brand-200">
          &copy; {new Date().getFullYear()} {data.site.name}. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</div>
