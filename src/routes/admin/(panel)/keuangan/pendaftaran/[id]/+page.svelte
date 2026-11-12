<script lang="ts">
  import { CheckCircle2, ExternalLink, Wallet, XCircle } from "@lucide/svelte";
  import { formatDate, formatDateTime, formatRupiah } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let rejecting = $state<string | null>(null);
  let cashAmount = $state(0);

  $effect(() => {
    cashAmount = data.remaining;
  });

  const feeGroups = $derived(
    [
      { label: "Pondok", items: data.invoiceItems.filter((item) => item.scope === "pondok") },
      { label: "Sekolah", items: data.invoiceItems.filter((item) => item.scope === "sekolah") }
    ].filter((group) => group.items.length > 0)
  );

  const unpaidInstallments = $derived(
    data.installments.filter((item) => item.status === "unpaid")
  );

  function handleInstallment(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    const installment = data.installments.find((item) => item.id === id);
    cashAmount = installment ? installment.amount : data.remaining;
  }

  const statusLabel: Record<string, string> = {
    submitted: "Terkirim",
    verified: "Terverifikasi",
    accepted: "Diterima",
    rejected: "Ditolak",
    checked_in: "Check-in",
    documents_complete: "Berkas lengkap",
    enrolled: "Santri aktif"
  };
</script>

<svelte:head><title>Pembayaran {data.registration.code} | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
  <div>
    <a href="/admin/pembayaran" class="text-sm font-medium text-brand-700 hover:underline">
      ← Kembali ke pembayaran
    </a>
    <h1 class="mt-2 text-2xl font-semibold text-stone-900">{data.registration.fullName}</h1>
    <p class="font-mono text-sm text-stone-500">{data.registration.code}</p>
    <p class="text-sm text-stone-500">
      {data.categoryName} · {data.academicYear} · {statusLabel[data.registration.status] ?? data.registration.status}
    </p>
  </div>
  <div class="flex flex-wrap gap-2">
    {#if data.registration.documentsVerifiedAt}
      <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Berkas lengkap</span>
    {:else}
      <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Berkas belum lengkap</span>
    {/if}
    {#if data.isSantri}
      <span class="rounded-full bg-brand-700 px-3 py-1 text-xs font-medium text-white">Sudah menjadi santri</span>
    {/if}
  </div>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

{#if data.registration.status === "rejected"}
  <div class="mt-4 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
    <p class="text-sm font-semibold text-red-800">Pendaftaran ditolak</p>
    <p class="mt-1 text-sm text-red-700">
      Pembayaran tidak dapat diverifikasi atau dicatat untuk pendaftaran ini.
    </p>
  </div>
{:else if data.registration.status === "needs_revision"}
  <div class="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
    <p class="text-sm font-semibold text-amber-800">Pendaftaran sedang diperbaiki</p>
    <p class="mt-1 text-sm text-amber-700">
      Pembayaran ditahan sampai wali menyimpan perbaikan data.
    </p>
  </div>
{/if}

{#if data.invoice}
  <section class="mt-5 rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="flex items-center gap-2 font-semibold text-stone-900">
      <Wallet class="h-4 w-4 text-brand-700" /> Tagihan
    </h2>
    <div class="mt-3 grid gap-3 rounded-lg bg-stone-50 p-4 sm:grid-cols-4">
      <div>
        <p class="text-xs text-stone-500">Total tagihan</p>
        <p class="text-lg font-semibold text-stone-900">{formatRupiah(data.invoice.totalAmount)}</p>
      </div>
      <div>
        <p class="text-xs text-stone-500">Terverifikasi</p>
        <p class="text-lg font-semibold text-brand-700">{formatRupiah(data.paid)}</p>
      </div>
      <div>
        <p class="text-xs text-stone-500">Sisa</p>
        <p class="text-lg font-semibold text-amber-600">{formatRupiah(data.remaining)}</p>
      </div>
      <div>
        <p class="text-xs text-stone-500">Skema</p>
        <p class="text-sm font-semibold text-stone-900">
          {data.invoice.scheme === "full" ? "Lunas" : "Cicilan 3×"}
        </p>
      </div>
    </div>

    {#if data.invoice.scheme === "full" && data.paid > 0 && data.remaining > 0}
      <p class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Skema saat ini <strong>Lunas</strong>. Pembayaran Rp {data.paid.toLocaleString("id-ID")} belum menutup tagihan.
        Jika seharusnya cicilan, ubah skema di bawah.
      </p>
    {/if}

    {#if data.canChangeScheme && data.invoice.status !== "paid" && data.registration.status !== "rejected" && data.registration.status !== "needs_revision"}
      <form method="POST" action="?/scheme" class="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 p-3">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Ubah skema pembayaran</span>
          <select name="scheme" class="rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="full" selected={data.invoice.scheme === "full"}>Lunas</option>
            <option value="installment_3" selected={data.invoice.scheme === "installment_3"}>
              Cicilan 3×
            </option>
          </select>
        </label>
        <button type="submit" class="rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900">
          Simpan skema
        </button>
        <p class="max-w-md text-xs text-stone-500">
          Pembayaran yang sudah terverifikasi tetap dihitung. Gunakan jika pilihan skema saat pendaftaran keliru.
        </p>
      </form>
    {/if}

    {#if feeGroups.length > 0}
      <div class="mt-4 space-y-3">
        {#each feeGroups as group (group.label)}
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wide text-stone-500">{group.label}</h3>
            <div class="mt-1 divide-y divide-stone-100">
              {#each group.items as item (item.id)}
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
        {/each}
      </div>
    {/if}

    <div class="mt-4 divide-y divide-stone-100">
      {#each data.installments as installment (installment.id)}
        <div class="flex items-center justify-between gap-2 py-2 text-sm">
          <span class="text-stone-700">
            {data.invoice.scheme === "full" ? "Pembayaran penuh" : `Cicilan ke-${installment.sequence}`}
            <span class="text-xs text-stone-400">· jatuh tempo {formatDate(installment.dueDate)}</span>
          </span>
          <span class="flex items-center gap-3">
            <span class="font-medium text-stone-900">{formatRupiah(installment.amount)}</span>
            <span class="text-xs {installment.status === 'paid' ? 'text-brand-700' : 'text-amber-600'}">
              {installment.status === "paid" ? "Lunas" : "Belum"}
            </span>
          </span>
        </div>
      {/each}
    </div>
  </section>

  <section class="mt-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Riwayat pembayaran</h2>
    {#if data.payments.length === 0}
      <p class="mt-2 text-sm text-stone-500">Belum ada pembayaran.</p>
    {:else}
      <div class="mt-3 divide-y divide-stone-100">
        {#each data.payments as payment (payment.id)}
          <div class="py-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p class="font-medium text-stone-900">
                  {formatRupiah(payment.amount)} · {payment.method === "cash" ? "Tunai" : "Transfer"}
                </p>
                <p class="text-xs text-stone-500">
                  Dibayar {formatDateTime(payment.createdAt)}
                  {#if payment.referenceNumber}· {payment.referenceNumber}{/if}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs {payment.status === 'verified'
                    ? 'text-brand-700'
                    : payment.status === 'rejected'
                      ? 'text-red-600'
                      : 'text-amber-600'}"
                >
                  {payment.status === "verified"
                    ? "Terverifikasi"
                    : payment.status === "rejected"
                      ? "Ditolak"
                      : "Menunggu"}
                </span>
                {#if payment.proofPath}
                  <a
                    href="/admin/pembayaran/bukti/{payment.id}"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                  >
                    Bukti <ExternalLink class="h-3 w-3" />
                  </a>
                {/if}
              </div>
            </div>

            {#if payment.status === "pending" && data.permissions.payment && data.registration.status !== "rejected" && data.registration.status !== "needs_revision"}
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <form method="POST" action="?/verify">
                  <input type="hidden" name="id" value={payment.id} />
                  <button class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">
                    <CheckCircle2 class="h-3.5 w-3.5" /> Verifikasi
                  </button>
                </form>
                {#if rejecting === payment.id}
                  <form method="POST" action="?/reject" class="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={payment.id} />
                    <input name="reason" placeholder="Alasan penolakan" required class="rounded-lg border border-stone-300 px-3 py-1.5 text-xs" />
                    <button class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Tolak</button>
                    <button type="button" onclick={() => (rejecting = null)} class="text-xs text-stone-500 hover:underline">Batal</button>
                  </form>
                {:else}
                  <button
                    type="button"
                    onclick={() => (rejecting = payment.id)}
                    class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <XCircle class="h-3.5 w-3.5" /> Tolak
                  </button>
                {/if}
              </div>
            {/if}

            {#if payment.status === "rejected" && payment.rejectionReason}
              <p class="mt-1 text-xs text-red-600">Alasan: {payment.rejectionReason}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if data.remaining > 0 && data.permissions.payment && data.registration.status !== "rejected" && data.registration.status !== "needs_revision"}
      <form method="POST" action="?/cash" class="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-4 sm:items-end">
        <input type="hidden" name="invoiceId" value={data.invoice.id} />
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs font-medium text-stone-500">Catat pembayaran tunai</span>
          <select name="installmentId" onchange={handleInstallment} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="">Sebagian / sisa tagihan</option>
            {#each unpaidInstallments as installment (installment.id)}
              <option value={installment.id}>
                {data.invoice.scheme === "full" ? "Pembayaran penuh" : `Cicilan ke-${installment.sequence}`} · {formatRupiah(installment.amount)}
              </option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Nominal (Rp)</span>
          <input name="amount" type="number" min="1" step="1" bind:value={cashAmount} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" class="rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900">
          Catat tunai
        </button>
        <label class="block sm:col-span-4">
          <input name="note" placeholder="Catatan (opsional)" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
      </form>
    {/if}
  </section>
{:else}
  <section class="mt-4 rounded-xl border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-500">
    Pendaftaran ini belum memiliki tagihan.
  </section>
{/if}
