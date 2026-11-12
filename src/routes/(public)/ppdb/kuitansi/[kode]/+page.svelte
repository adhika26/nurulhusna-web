<script lang="ts">
  import { Printer } from "@lucide/svelte";
  import { formatDate, formatDateTime, formatRupiah } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const verifiedTotal = $derived(data.paidAmount);
</script>

<svelte:head>
  <title>Kuitansi {data.registration.code} | {data.site.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
    <a href="/ppdb/status/{data.registration.code}" class="text-sm font-medium text-brand-700 hover:underline">
      ← Kembali ke status
    </a>
    <button
      type="button"
      onclick={() => window.print()}
      class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
    >
      <Printer class="h-4 w-4" /> Cetak kuitansi
    </button>
  </div>

  <article class="rounded-2xl bg-white p-8 text-stone-900 ring-1 ring-stone-200 print:rounded-none print:p-0 print:ring-0">
    <header class="flex items-start justify-between gap-6 border-b border-stone-200 pb-5">
      <div>
        <h1 class="text-lg font-bold uppercase tracking-wide">{data.site.name}</h1>
        <p class="mt-1 text-xs text-stone-600">{data.site.address}</p>
      </div>
      <img src={data.qr} alt="QR kode {data.registration.code}" class="h-24 w-24" />
    </header>

    <h2 class="mt-6 text-center text-base font-semibold uppercase tracking-wide">Bukti Pembayaran</h2>

    <dl class="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
      <div class="flex justify-between gap-3 border-b border-dashed border-stone-200 py-1">
        <dt class="text-stone-500">Kode pendaftaran</dt>
        <dd class="font-mono font-semibold">{data.registration.code}</dd>
      </div>
      <div class="flex justify-between gap-3 border-b border-dashed border-stone-200 py-1">
        <dt class="text-stone-500">Nama santri</dt>
        <dd class="font-semibold">{data.registration.fullName}</dd>
      </div>
      <div class="flex justify-between gap-3 border-b border-dashed border-stone-200 py-1">
        <dt class="text-stone-500">Kategori</dt>
        <dd>{data.category?.name ?? "-"}</dd>
      </div>
      <div class="flex justify-between gap-3 border-b border-dashed border-stone-200 py-1">
        <dt class="text-stone-500">Tahun ajaran</dt>
        <dd>{data.academicYear}</dd>
      </div>
    </dl>

    {#if data.invoice}
      <div class="mt-6">
        <div class="flex items-center justify-between text-sm font-semibold">
          <span>Total tagihan</span>
          <span>{formatRupiah(data.invoice.totalAmount)}</span>
        </div>
        <div class="mt-1 flex items-center justify-between text-sm">
          <span class="text-stone-500">Sudah dibayar</span>
          <span class="font-semibold text-brand-700">{formatRupiah(verifiedTotal)}</span>
        </div>
        <div class="mt-1 flex items-center justify-between text-sm">
          <span class="text-stone-500">Sisa</span>
          <span class="font-semibold">{formatRupiah(data.remaining)}</span>
        </div>
      </div>

      {#if data.invoiceItems.length > 0}
        <table class="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
              <th class="py-2">Rincian</th>
              <th class="py-2 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {#each data.invoiceItems as item (item.id)}
              <tr class="border-b border-stone-100">
                <td class="py-1.5">
                  {item.name}
                  <span class="text-xs text-stone-400">({item.scope === "pondok" ? "Pondok" : "Sekolah"})</span>
                </td>
                <td class="py-1.5 text-right">{formatRupiah(item.amount)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    {/if}

    <div class="mt-6">
      <h3 class="text-sm font-semibold">Pembayaran terverifikasi</h3>
      {#if data.payments.length === 0}
        <p class="mt-2 text-sm text-stone-500">Belum ada pembayaran yang diverifikasi.</p>
      {:else}
        <table class="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
              <th class="py-2">Tanggal</th>
              <th class="py-2">Metode</th>
              <th class="py-2">Referensi</th>
              <th class="py-2 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {#each data.payments as payment (payment.id)}
              <tr class="border-b border-stone-100">
                <td class="py-1.5">{formatDateTime(payment.paidAt)}</td>
                <td class="py-1.5">{payment.method === "cash" ? "Tunai" : "Transfer"}</td>
                <td class="py-1.5">{payment.referenceNumber || "-"}</td>
                <td class="py-1.5 text-right">{formatRupiah(payment.amount)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

    <footer class="mt-10 flex items-end justify-between gap-6 text-xs text-stone-600">
      <p>Dicetak {formatDate(new Date())}. Tunjukkan bukti ini kepada staff pembayaran.</p>
      <div class="text-center">
        <p>Petugas</p>
        <div class="mt-12 w-40 border-t border-stone-400"></div>
      </div>
    </footer>
  </article>
</div>
