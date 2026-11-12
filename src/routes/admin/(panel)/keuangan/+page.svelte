<script lang="ts">
  import { AlertCircle, CheckCircle2, Clock, Wallet } from "@lucide/svelte";
  import { formatDateTime, formatRupiah } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Ringkasan Pembayaran | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Ringkasan Pembayaran</h1>
    <p class="mt-1 text-sm text-stone-500">Pantau tagihan dan verifikasi pembayaran santri.</p>
  </div>
  <a href="/admin/pembayaran" class="text-sm font-medium text-brand-700 hover:underline">
    Buka halaman pembayaran
  </a>
</div>

<div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <a href="/admin/pembayaran" class="rounded-xl bg-white p-4 ring-1 ring-stone-200 hover:ring-brand-400">
    <p class="text-xs uppercase tracking-wide text-stone-500">Menunggu verifikasi</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.stats.pending}</p>
  </a>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Tagihan belum dibayar</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.stats.unpaid}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Dibayar sebagian</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.stats.partial}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Terverifikasi hari ini</p>
    <p class="mt-1 text-2xl font-semibold text-brand-700">{formatRupiah(data.stats.verifiedToday)}</p>
  </div>
</div>

<section class="mt-6 rounded-xl bg-white ring-1 ring-stone-200">
  <div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
    <h2 class="flex items-center gap-2 font-semibold text-stone-900">
      <Clock class="h-4 w-4 text-amber-500" /> Menunggu verifikasi
    </h2>
    <a href="/admin/pembayaran" class="text-sm font-medium text-brand-700 hover:underline">Lihat semua</a>
  </div>
  {#if data.pending.length === 0}
    <p class="p-5 text-sm text-stone-500">Tidak ada pembayaran yang menunggu verifikasi.</p>
  {:else}
    <div class="divide-y divide-stone-100">
      {#each data.pending as row (row.payment.id)}
        <a
          href="/admin/keuangan/pendaftaran/{row.registration.id}"
          class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-stone-50"
        >
          <div>
            <p class="text-sm font-medium text-stone-900">{row.registration.fullName}</p>
            <p class="font-mono text-xs text-stone-400">{row.registration.code}</p>
            <p class="text-xs text-stone-500">
              {row.installment?.sequence ? `Cicilan ke-${row.installment.sequence}` : "Pembayaran sebagian"}
              · dikirim {formatDateTime(row.payment.createdAt)}
            </p>
          </div>
          <p class="text-sm font-semibold text-stone-900">{formatRupiah(Number(row.payment.amount))}</p>
        </a>
      {/each}
    </div>
  {/if}
</section>

<section class="mt-6 rounded-xl bg-white ring-1 ring-stone-200">
  <div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
    <h2 class="flex items-center gap-2 font-semibold text-stone-900">
      <AlertCircle class="h-4 w-4 text-brand-700" /> Berkas lengkap, menunggu pembayaran
    </h2>
  </div>
  {#if data.waitingPayment.length === 0}
    <p class="p-5 text-sm text-stone-500">Tidak ada tagihan yang menunggu pembayaran.</p>
  {:else}
    <div class="divide-y divide-stone-100">
      {#each data.waitingPayment as row (row.invoice.id)}
        <a
          href="/admin/keuangan/pendaftaran/{row.registration.id}"
          class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-stone-50"
        >
          <div>
            <p class="text-sm font-medium text-stone-900">{row.registration.fullName}</p>
            <p class="font-mono text-xs text-stone-400">{row.registration.code}</p>
            <p class="text-xs text-stone-500">{row.category.name}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-stone-900">{formatRupiah(Number(row.invoice.totalAmount))}</p>
            <p class="text-xs text-amber-600">
              {row.invoice.status === "partial" ? "Dibayar sebagian" : "Belum dibayar"}
            </p>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<div class="mt-6 flex flex-wrap gap-3">
  <a
    href="/admin/pembayaran"
    class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
  >
    <Wallet class="h-4 w-4" /> Verifikasi pembayaran
  </a>
  <p class="inline-flex items-center gap-1.5 text-sm text-stone-500">
    <CheckCircle2 class="h-4 w-4 text-brand-600" />
    Total terverifikasi {formatRupiah(data.stats.verifiedTotal)}
  </p>
</div>
