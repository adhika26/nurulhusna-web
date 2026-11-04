<script lang="ts">
  import { Images, Newspaper, FileText, ArrowRight } from "@lucide/svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cards = $derived([
    {
      href: "/admin/konten/halaman",
      title: "Halaman",
      description: "Profil, program, fasilitas, dan kontak.",
      icon: FileText,
      value: `${data.counts.pages} halaman`
    },
    {
      href: "/admin/konten/berita",
      title: "Berita",
      description: "Kabar dan pengumuman pondok.",
      icon: Newspaper,
      value: `${data.counts.publishedPosts} terbit dari ${data.counts.posts}`
    },
    {
      href: "/admin/konten/galeri",
      title: "Galeri",
      description: "Foto kegiatan dan lingkungan pondok.",
      icon: Images,
      value: `${data.counts.gallery} foto`
    }
  ]);
</script>

<svelte:head><title>Konten | Admin Nurul Husna</title></svelte:head>

<h1 class="text-2xl font-semibold text-stone-900">Konten</h1>
<p class="mt-1 text-sm text-stone-500">Kelola isi halaman publik website.</p>

<div class="mt-6 grid gap-4 sm:grid-cols-3">
  {#each cards as card (card.href)}
    <a href={card.href} class="rounded-xl bg-white p-5 ring-1 ring-stone-200 hover:ring-brand-400">
      <card.icon class="h-5 w-5 text-brand-700" />
      <h2 class="mt-3 font-semibold text-stone-900">{card.title}</h2>
      <p class="mt-1 text-sm text-stone-500">{card.description}</p>
      <p class="mt-3 text-xs text-stone-400">{card.value}</p>
      <span class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
        Kelola <ArrowRight class="h-4 w-4" />
      </span>
    </a>
  {/each}
</div>
