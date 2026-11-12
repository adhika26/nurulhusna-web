<script lang="ts">
  import { Check, Copy, Printer, QrCode as QrIcon, Search, Wallet } from "@lucide/svelte";
  import { formatDate, formatRupiah } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let copied = $state(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(data.registration.code);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      copied = false;
    }
  }

  const schemeLabel = $derived(
    data.invoice?.scheme === "installment_3" ? "Cicilan 3×" : "Lunas"
  );
</script>

<svelte:head>
  <title>Pendaftaran Berhasil | {data.registration.code}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
  <div class="text-center">
    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
      <Check class="h-7 w-7" />
    </div>
    <h1 class="mt-4 text-2xl font-bold text-stone-900">Pendaftaran berhasil dikirim</h1>
    <p class="mt-1 text-sm text-stone-600">
      Simpan kode pendaftaran ini dan tunjukkan saat datang ke asrama.
    </p>
  </div>

  <section class="mt-8 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
    <div class="border-b border-stone-100 bg-brand-800 px-6 py-8 text-center text-white">
      <p class="text-sm text-brand-200">Kode Pendaftaran</p>
      <p class="mt-2 font-mono text-3xl font-bold tracking-wider">{data.registration.code}</p>
      <button
        type="button"
        onclick={copyCode}
        class="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
      >
        <Copy class="h-3.5 w-3.5" /> {copied ? "Tersalin" : "Salin kode"}
      </button>
    </div>

    <div class="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-start">
      <div class="space-y-2 text-sm">
        <div class="flex justify-between gap-4 border-b border-stone-100 py-2">
          <span class="text-stone-500">Nama santri</span>
          <span class="font-medium text-stone-900">{data.registration.fullName}</span>
        </div>
        <div class="flex justify-between gap-4 border-b border-stone-100 py-2">
          <span class="text-stone-500">Kategori</span>
          <span class="text-right font-medium text-stone-900">{data.category?.name ?? "-"}</span>
        </div>
        <div class="flex justify-between gap-4 border-b border-stone-100 py-2">
          <span class="text-stone-500">Lembaga</span>
          <span class="text-right text-stone-900">{data.category?.institutionName ?? "-"}</span>
        </div>
        <div class="flex justify-between gap-4 border-b border-stone-100 py-2">
          <span class="text-stone-500">Tahun ajaran</span>
          <span class="text-stone-900">{data.academicYear}</span>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <span class="text-stone-500">Tanggal daftar</span>
          <span class="text-stone-900">{formatDate(data.registration.createdAt)}</span>
        </div>
      </div>

      <div class="mx-auto text-center">
        <img src={data.qr} alt="QR kode pendaftaran {data.registration.code}" class="h-40 w-40" />
        <p class="mt-1 flex items-center justify-center gap-1 text-xs text-stone-600">
          <QrIcon class="h-3.5 w-3.5" /> Pindai saat check-in
        </p>
      </div>
    </div>
  </section>

  <section class="mt-5 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
    <h2 class="flex items-center gap-2 font-semibold text-stone-900">
      <Wallet class="h-4 w-4 text-brand-700" /> Rincian pembayaran
    </h2>

    {#if data.invoice}
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4">
        <div>
          <p class="text-xs text-stone-500">Total biaya</p>
          <p class="text-xl font-semibold text-stone-900">{formatRupiah(data.invoice.totalAmount)}</p>
        </div>
        <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {schemeLabel}
        </span>
      </div>

      {#if data.invoiceItems.length > 0}
        <div class="mt-4 space-y-3 border-t border-stone-100 pt-4">
          {#each [{ label: "Pondok", scope: "pondok" }, { label: "Sekolah", scope: "sekolah" }] as group (group.scope)}
            {@const items = data.invoiceItems.filter((item) => item.scope === group.scope)}
            {#if items.length > 0}
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">{group.label}</p>
                <div class="mt-1 divide-y divide-stone-100">
                  {#each items as item (item.id)}
                    <div class="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span class="text-stone-700">
                        {item.name}
                        {#if item.isRecurring}
                          <span class="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">bulanan</span>
                        {/if}
                      </span>
                      <span class="font-medium text-stone-900">{formatRupiah(item.amount)}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <div class="mt-4 divide-y divide-stone-100">
        {#each data.installments as installment (installment.sequence)}
          <div class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div>
              <p class="font-medium text-stone-800">
                {data.invoice.scheme === "full"
                  ? "Pembayaran penuh"
                  : `Cicilan ke-${installment.sequence}`}
              </p>
              <p class="text-xs text-stone-600">Jatuh tempo {formatDate(installment.dueDate)}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-stone-900">{formatRupiah(installment.amount)}</p>
              <p class="text-xs {installment.status === 'paid' ? 'text-brand-700' : 'text-amber-600'}">
                {installment.status === "paid" ? "Lunas" : "Belum dibayar"}
              </p>
            </div>
          </div>
        {/each}
      </div>

      {#if data.bank.name || data.bank.accountNumber}
        <div class="mt-4 rounded-2xl border border-stone-200 p-4 text-sm">
          <p class="font-medium text-stone-800">Transfer ke</p>
          <p class="mt-1 text-stone-600">
            {data.bank.name} · <span class="font-mono">{data.bank.accountNumber}</span>
            {#if data.bank.accountName}· a.n. {data.bank.accountName}{/if}
          </p>
        </div>
      {/if}
    {:else}
      <p class="mt-3 text-sm text-stone-600">
        Rincian biaya belum tersedia. Pengurus pondok akan menginformasikan tagihan Anda.
      </p>
    {/if}
  </section>

  <div class="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
    <button
      type="button"
      onclick={() => window.print()}
      class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
    >
      <Printer class="h-4 w-4" /> Cetak bukti
    </button>
    <a
      href="/ppdb/status?kode={data.registration.code}"
      class="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
    >
      <Search class="h-4 w-4" /> Cek status & bayar
    </a>
  </div>

  <p class="mt-6 text-center text-xs text-stone-600">
    Jika kode ini hilang, hubungi pengurus pondok dengan menyebutkan nama santri.
  </p>
</div>
