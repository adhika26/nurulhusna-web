<script lang="ts">
  import { Search } from "@lucide/svelte";
  import { formatDate, formatRupiah } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const tabs = [
    { value: "", label: "Semua" },
    { value: "submitted", label: "Terkirim" },
    { value: "verified", label: "Terverifikasi" },
    { value: "accepted", label: "Diterima" },
    { value: "rejected", label: "Ditolak" },
    { value: "checked_in", label: "Check-in" }
  ];

  const statusLabel: Record<string, string> = {
    submitted: "Terkirim",
    verified: "Terverifikasi",
    accepted: "Diterima",
    rejected: "Ditolak",
    checked_in: "Check-in",
    draft: "Draft"
  };

  const statusClass: Record<string, string> = {
    submitted: "bg-blue-50 text-blue-700",
    verified: "bg-indigo-50 text-indigo-700",
    accepted: "bg-brand-50 text-brand-700",
    rejected: "bg-red-50 text-red-700",
    checked_in: "bg-brand-100 text-brand-800"
  };

  const invoiceLabel: Record<string, string> = {
    unpaid: "Belum bayar",
    partial: "Sebagian",
    paid: "Lunas",
    cancelled: "Dibatalkan"
  };

  const invoiceClass: Record<string, string> = {
    unpaid: "text-stone-500",
    partial: "text-amber-600",
    paid: "text-brand-700",
    cancelled: "text-red-600"
  };
</script>

<svelte:head><title>Pendaftaran | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Pendaftaran</h1>
    <p class="mt-1 text-sm text-stone-500">Data santri yang mendaftar online maupun diinput pengurus.</p>
  </div>
  <a href="/admin/pendaftaran/baru" class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
    + Pendaftaran offline
  </a>
</div>

<form method="GET" class="mt-5 flex flex-wrap items-center gap-3">
  <div class="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3">
    <Search class="h-4 w-4 text-stone-400" />
    <input
      name="q"
      value={data.q}
      placeholder="Cari nama atau kode"
      class="w-56 bg-transparent py-2 text-sm outline-none"
    />
  </div>
  {#if data.status}
    <input type="hidden" name="status" value={data.status} />
  {/if}
  <button type="submit" class="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900">
    Cari
  </button>
</form>

<div class="mt-4 flex flex-wrap gap-2">
  {#each tabs as tab (tab.value)}
    <a
      href="/admin/pendaftaran{tab.value ? `?status=${tab.value}` : ''}"
      class="rounded-full px-3 py-1.5 text-xs font-medium {data.status === (tab.value || null)
        ? 'bg-brand-700 text-white'
        : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'}"
    >
      {tab.label}
      {#if tab.value}
        <span class="ml-1 opacity-70">{data.counts[tab.value] ?? 0}</span>
      {:else}
        <span class="ml-1 opacity-70">{Object.values(data.counts).reduce((a, b) => a + b, 0)}</span>
      {/if}
    </a>
  {/each}
</div>

<div class="mt-4 overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
  <table class="w-full min-w-[720px] text-left text-sm">
    <thead class="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
      <tr>
        <th class="px-4 py-3 font-medium">Santri</th>
        <th class="px-4 py-3 font-medium">Kategori</th>
        <th class="px-4 py-3 font-medium">Status</th>
        <th class="px-4 py-3 font-medium">Pembayaran</th>
        <th class="px-4 py-3 font-medium">Tanggal</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-stone-100">
      {#each data.rows as row (row.id)}
        <tr class="hover:bg-stone-50/60">
          <td class="px-4 py-3">
            <a href="/admin/pendaftaran/{row.id}" class="font-medium text-stone-900 hover:underline">{row.fullName}</a>
            <p class="font-mono text-xs text-stone-400">{row.code}</p>
          </td>
          <td class="px-4 py-3 text-stone-600">
            {row.categoryName}
            <p class="text-xs text-stone-400">{row.source === "offline" ? "Offline" : "Online"}</p>
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2.5 py-1 text-xs font-medium {statusClass[row.status] ?? 'bg-stone-100 text-stone-600'}">
              {statusLabel[row.status] ?? row.status}
            </span>
          </td>
          <td class="px-4 py-3">
            {#if row.invoiceStatus}
              <p class="font-medium {invoiceClass[row.invoiceStatus]}">{invoiceLabel[row.invoiceStatus]}</p>
              <p class="text-xs text-stone-400">{formatRupiah(Number(row.invoiceTotal))}</p>
            {:else}
              <span class="text-xs text-stone-400">Tanpa tagihan</span>
            {/if}
          </td>
          <td class="px-4 py-3 text-stone-500">{formatDate(row.createdAt)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if data.rows.length === 0}
    <p class="p-6 text-center text-sm text-stone-500">Belum ada pendaftar yang cocok.</p>
  {/if}
</div>
