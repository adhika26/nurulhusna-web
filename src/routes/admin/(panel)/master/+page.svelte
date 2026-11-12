<script lang="ts">
  import { Tags, CalendarDays, Wallet, ArrowRight } from "@lucide/svelte";

  const items = [
    {
      href: "/admin/master/kategori",
      label: "Kategori Santri",
      description: "Kategori pendaftaran, nama lembaga, dan urutan tampil.",
      icon: Tags
    },
    {
      href: "/admin/master/gelombang",
      label: "Gelombang",
      description: "Periode pendaftaran dan tahun ajaran yang aktif.",
      icon: CalendarDays
    },
    {
      href: "/admin/master/biaya",
      label: "Paket Biaya",
      description: "Rincian biaya pondok dan sekolah per kategori dan gelombang.",
      icon: Wallet
    }
  ];
</script>

<svelte:head><title>Data Master | Admin Nurul Husna</title></svelte:head>

<h1 class="text-2xl font-semibold text-stone-900">Data Master</h1>
<p class="mt-1 text-sm text-stone-500">
  Data dasar yang dipakai formulir pendaftaran dan perhitungan tagihan.
</p>

<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {#each items as item (item.href)}
    <a
      href={item.href}
      class="group rounded-xl bg-white p-5 ring-1 ring-stone-200 transition hover:ring-brand-400"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <item.icon class="h-5 w-5" />
      </div>
      <h2 class="mt-3 font-semibold text-stone-900">{item.label}</h2>
      <p class="mt-1 text-sm text-stone-500">{item.description}</p>
      <span class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
        Kelola <ArrowRight class="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </a>
  {/each}
</div>
