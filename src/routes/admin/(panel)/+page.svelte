<script lang="ts">
  import { ClipboardList, Clock, GraduationCap, UserCheck, Wallet } from "@lucide/svelte";
  import { formatDate, formatRupiah } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const cards = $derived(
    data.role === "staff_pendaftaran"
      ? [
          {
            label: "Total pendaftar",
            value: String(data.stats.total),
            icon: ClipboardList,
            href: "/admin/pendaftaran"
          },
          {
            label: "Perlu diproses",
            value: String(data.stats.submitted),
            icon: Clock,
            href: "/admin/pendaftaran?status=submitted"
          },
          {
            label: "Sudah diterima",
            value: String(data.stats.accepted),
            icon: UserCheck,
            href: "/admin/pendaftaran?status=accepted"
          },
          {
            label: "Santri aktif",
            value: String(data.stats.santri),
            icon: GraduationCap,
            href: "/admin/santri"
          }
        ]
      : [
          {
            label: "Total pendaftar",
            value: String(data.stats.total),
            icon: ClipboardList,
            href: "/admin/pendaftaran"
          },
          {
            label: "Perlu verifikasi",
            value: String(data.stats.submitted),
            icon: Clock,
            href: "/admin/pendaftaran?status=submitted"
          },
          {
            label: "Pembayaran pending",
            value: String(data.stats.pendingPayments),
            icon: Wallet,
            href: "/admin/pembayaran"
          },
          {
            label: "Santri aktif",
            value: String(data.stats.santri),
            icon: GraduationCap,
            href: "/admin/santri"
          }
        ]
  );

  const statusLabel: Record<string, string> = {
    submitted: "Terkirim",
    verified: "Terverifikasi",
    accepted: "Diterima",
    rejected: "Ditolak",
    checked_in: "Check-in",
    documents_complete: "Berkas lengkap",
    enrolled: "Santri aktif",
    needs_revision: "Perlu revisi",
    draft: "Draft"
  };
</script>

<svelte:head><title>Ringkasan | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Ringkasan</h1>
    <p class="mt-1 text-sm text-stone-500">Halo, {data.user.fullName}.</p>
  </div>
  {#if data.role === "super_admin"}
    <p class="text-sm text-stone-500">
      Pembayaran terverifikasi: <span class="font-semibold text-brand-700">{formatRupiah(data.stats.verifiedAmount)}</span>
    </p>
  {/if}
</div>

<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {#each cards as card (card.label)}
    <a href={card.href} class="rounded-xl bg-white p-5 ring-1 ring-stone-200 transition hover:ring-brand-400">
      <div class="flex items-center justify-between">
        <p class="text-sm text-stone-500">{card.label}</p>
        <card.icon class="h-4 w-4 text-brand-700" />
      </div>
      <p class="mt-2 text-3xl font-semibold text-stone-900">{card.value}</p>
    </a>
  {/each}
</div>

<section class="mt-6 rounded-xl bg-white ring-1 ring-stone-200">
  <div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
    <h2 class="font-semibold text-stone-900">Pendaftar terbaru</h2>
    <a href="/admin/pendaftaran" class="text-sm font-medium text-brand-700 hover:underline">Lihat semua</a>
  </div>
  {#if data.recent.length === 0}
    <p class="p-5 text-sm text-stone-500">Belum ada pendaftar.</p>
  {:else}
    <div class="divide-y divide-stone-100">
      {#each data.recent as row (row.id)}
        <a href="/admin/pendaftaran/{row.id}" class="flex items-center justify-between gap-3 px-5 py-3 hover:bg-stone-50">
          <div>
            <p class="text-sm font-medium text-stone-900">{row.fullName}</p>
            <p class="font-mono text-xs text-stone-400">{row.code}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-stone-500">{statusLabel[row.status] ?? row.status}</p>
            <p class="text-xs text-stone-400">{formatDate(row.createdAt)}</p>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>
