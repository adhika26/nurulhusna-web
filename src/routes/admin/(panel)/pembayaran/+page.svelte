<script lang="ts">
  import { CheckCircle2, ExternalLink, XCircle } from "@lucide/svelte";
  import { formatDateTime, formatRupiah } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let rejecting = $state<string | null>(null);
</script>

<svelte:head><title>Pembayaran | Admin Nurul Husna</title></svelte:head>

<h1 class="text-2xl font-semibold text-stone-900">Pembayaran</h1>
<p class="mt-1 text-sm text-stone-500">
  Verifikasi bukti transfer yang dikirim wali santri.
</p>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<section class="mt-6">
  <h2 class="text-sm font-semibold uppercase tracking-wide text-stone-500">
    Menunggu verifikasi ({data.pending.length})
  </h2>

  {#if data.pending.length === 0}
    <div class="mt-3 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
      Tidak ada pembayaran yang menunggu verifikasi.
    </div>
  {:else}
    <div class="mt-3 space-y-3">
      {#each data.pending as row (row.payment.id)}
        <div class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-stone-900">
                <a href="/admin/keuangan/pendaftaran/{row.registration.id}" class="hover:underline">{row.registration.fullName}</a>
              </p>
              <p class="font-mono text-xs text-stone-500">{row.registration.code}</p>
              <p class="mt-1 text-sm text-stone-600">
                {row.installment?.sequence
                  ? `Cicilan ke-${row.installment.sequence}`
                  : "Pembayaran sebagian/sisa"}
                · dikirim {formatDateTime(row.payment.createdAt)}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xl font-semibold text-stone-900">{formatRupiah(Number(row.payment.amount))}</p>
              <a
                href="/admin/pembayaran/bukti/{row.payment.id}"
                target="_blank"
                rel="noopener"
                class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
              >
                Lihat bukti <ExternalLink class="h-3 w-3" />
              </a>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
            {#if data.permissions.payment}
            <form method="POST" action="?/verify">
              <input type="hidden" name="id" value={row.payment.id} />
              <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">
                <CheckCircle2 class="h-3.5 w-3.5" /> Verifikasi
              </button>
            </form>

            {#if rejecting === row.payment.id}
              <form method="POST" action="?/reject" class="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={row.payment.id} />
                <input
                  name="reason"
                  placeholder="Alasan penolakan"
                  required
                  class="min-w-48 flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
                />
                <button type="submit" class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                  Tolak
                </button>
                <button type="button" onclick={() => (rejecting = null)} class="text-xs text-stone-500 hover:underline">
                  Batal
                </button>
              </form>
            {:else}
              <button
                type="button"
                onclick={() => (rejecting = row.payment.id)}
                class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <XCircle class="h-3.5 w-3.5" /> Tolak
              </button>
            {/if}
            {:else}
              <p class="text-xs text-stone-500">Hanya staff keuangan yang dapat memverifikasi pembayaran.</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

<section class="mt-8">
  <h2 class="text-sm font-semibold uppercase tracking-wide text-stone-500">Tagihan</h2>
  <div class="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
    {#if data.invoices.length === 0}
      <p class="p-5 text-sm text-stone-500">Belum ada tagihan.</p>
    {:else}
      <div class="divide-y divide-stone-100">
        {#each data.invoices as invoice (invoice.id)}
          <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <div>
              <a href="/admin/keuangan/pendaftaran/{invoice.registration.id}" class="font-medium text-stone-800 hover:underline">
                {invoice.registration.fullName}
              </a>
              <p class="font-mono text-xs text-stone-400">
                {invoice.registration.code} · {invoice.categoryName}
              </p>
            </div>
            <div class="text-right">
              <p class="font-medium text-stone-800">{formatRupiah(invoice.totalAmount)}</p>
              <p class="text-xs {invoice.status === 'paid' ? 'text-brand-700' : 'text-amber-600'}">
                {invoice.status === "paid"
                  ? "Lunas"
                  : invoice.status === "partial"
                    ? `Sisa ${formatRupiah(invoice.remaining)}`
                    : "Belum dibayar"}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<section class="mt-8">
  <h2 class="text-sm font-semibold uppercase tracking-wide text-stone-500">Riwayat terakhir</h2>
  <div class="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
    {#if data.history.length === 0}
      <p class="p-5 text-sm text-stone-500">Belum ada riwayat.</p>
    {:else}
      <div class="divide-y divide-stone-100">
        {#each data.history as row (row.payment.id)}
          <div class="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
            <div>
              <p class="font-medium text-stone-800">{row.registration.fullName}</p>
              <p class="font-mono text-xs text-stone-400">{row.registration.code}</p>
            </div>
            <div class="text-right">
              <p class="font-medium text-stone-800">{formatRupiah(Number(row.payment.amount))}</p>
              <p class="text-xs {row.payment.status === 'verified' ? 'text-brand-700' : 'text-red-600'}">
                {row.payment.status === "verified" ? "Terverifikasi" : "Ditolak"}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
