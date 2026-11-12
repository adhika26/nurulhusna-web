<script lang="ts">
  import { CheckCircle2, Clock, FileCheck2, Printer, Upload, XCircle } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { DOCUMENT_ITEMS } from "$lib/types/registration";
  import { formatDate, formatDateTime, formatRupiah } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const paidAmount = $derived(
    data.payments
      .filter((payment) => payment.status === "verified")
      .reduce((sum, payment) => sum + payment.amount, 0)
  );

  const remaining = $derived(data.invoice ? Math.max(data.invoice.totalAmount - paidAmount, 0) : 0);

  const feeGroups = $derived(
    [
      { label: "Pondok", items: data.invoiceItems.filter((item) => item.scope === "pondok") },
      { label: "Sekolah", items: data.invoiceItems.filter((item) => item.scope === "sekolah") }
    ].filter((group) => group.items.length > 0)
  );

  const unpaidInstallments = $derived(
    data.installments.filter((installment) => installment.status === "unpaid")
  );

  let selectedInstallment = $state("");
  let amountValue = $state(0);
  let showForm = $state(true);

  onMount(() => {
    amountValue = remaining;
  });

  function handleInstallmentChange(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    selectedInstallment = id;
    const installment = data.installments.find((item) => item.id === id);
    amountValue = installment ? installment.amount : remaining;
  }

  const statusLabel: Record<string, string> = {
    submitted: "Terkirim",
    verified: "Terverifikasi",
    accepted: "Diterima",
    rejected: "Ditolak",
    checked_in: "Sudah check-in",
    documents_complete: "Berkas lengkap",
    enrolled: "Santri aktif",
    needs_revision: "Perlu revisi",
    draft: "Draft"
  };

  const statusClass: Record<string, string> = {
    submitted: "bg-blue-50 text-blue-700",
    verified: "bg-indigo-50 text-indigo-700",
    accepted: "bg-brand-50 text-brand-700",
    rejected: "bg-red-50 text-red-700",
    checked_in: "bg-brand-100 text-brand-800",
    documents_complete: "bg-brand-100 text-brand-800",
    enrolled: "bg-brand-700 text-white",
    needs_revision: "bg-amber-50 text-amber-700",
    draft: "bg-stone-100 text-stone-600"
  };

  const paymentClass: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    verified: "bg-brand-50 text-brand-700",
    rejected: "bg-red-50 text-red-700"
  };

  const paymentLabel: Record<string, string> = {
    pending: "Menunggu verifikasi",
    verified: "Terverifikasi",
    rejected: "Ditolak"
  };
</script>

<svelte:head>
  <title>Status {data.registration.code} | {data.site.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <a href="/ppdb/status" class="text-sm font-medium text-brand-700 hover:underline">← Cek kode lain</a>
      <h1 class="mt-2 text-2xl font-bold text-stone-900">{data.registration.fullName}</h1>
      <p class="font-mono text-sm text-stone-500">{data.registration.code}</p>
    </div>
    <span class="rounded-full px-3 py-1 text-xs font-semibold {statusClass[data.registration.status] ?? 'bg-stone-100 text-stone-600'}">
      {statusLabel[data.registration.status] ?? data.registration.status}
    </span>
  </div>

  {#if form?.message}
    <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
      {form.message}
    </p>
  {/if}

  {#if data.registration.status === "rejected"}
    <div class="mt-4 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
      <p class="text-sm font-semibold text-red-800">Pendaftaran ditolak</p>
      <p class="mt-1 text-sm text-red-700">
        {data.registration.rejectionReason || "Silakan hubungi pengurus pondok untuk informasi lebih lanjut."}
      </p>
      <p class="mt-2 text-xs text-red-600">
        Pembayaran tidak dapat dikirim untuk pendaftaran yang sudah ditolak.
      </p>
    </div>
  {:else if data.registration.status === "needs_revision"}
    <div class="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <p class="text-sm font-semibold text-amber-800">Data perlu diperbaiki</p>
      <p class="mt-1 text-sm text-amber-700">
        {data.registration.revisionNote || "Silakan perbaiki data pendaftaran melalui akun Anda."}
      </p>
      <a href="/ppdb/akun" class="mt-2 inline-flex text-sm font-semibold text-amber-800 hover:underline">
        Buka akun dan perbaiki data
      </a>
    </div>
  {/if}

  <section class="mt-6 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
    <div class="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <p class="text-stone-500">Kategori</p>
        <p class="font-medium text-stone-900">{data.category?.name ?? "-"}</p>
      </div>
      <div>
        <p class="text-stone-500">Lembaga</p>
        <p class="text-stone-900">{data.category?.institutionName ?? "-"}</p>
      </div>
      <div>
        <p class="text-stone-500">Tahun ajaran</p>
        <p class="text-stone-900">{data.academicYear}</p>
      </div>
      <div>
        <p class="text-stone-500">Tanggal daftar</p>
        <p class="text-stone-900">{formatDate(data.registration.createdAt)}</p>
      </div>
    </div>
  </section>

  {#if data.invoice}
    <section class="mt-4 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm text-stone-500">Total tagihan</p>
          <p class="text-2xl font-semibold text-stone-900">{formatRupiah(data.invoice.totalAmount)}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-stone-500">Sudah terverifikasi</p>
          <p class="text-lg font-semibold text-brand-700">{formatRupiah(paidAmount)}</p>
          {#if remaining > 0}
            <p class="text-xs text-amber-600">Sisa {formatRupiah(remaining)}</p>
          {:else}
            <p class="text-xs text-brand-700">Lunas</p>
          {/if}
        </div>
      </div>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          class="h-full rounded-full bg-brand-600"
          style="width: {data.invoice.totalAmount > 0 ? Math.min((paidAmount / data.invoice.totalAmount) * 100, 100) : 0}%"
        ></div>
      </div>

      <p class="mt-2 text-xs text-stone-500">
        Status santri aktif otomatis setelah cicilan pertama terverifikasi dan berkas lengkap.
      </p>

      {#if paidAmount > 0}
        <a
          href="/ppdb/kuitansi/{data.registration.code}"
          class="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
        >
          <Printer class="h-3.5 w-3.5" /> Cetak bukti pembayaran
        </a>
      {/if}

      {#if feeGroups.length > 0}
        <div class="mt-5 space-y-3 border-t border-stone-100 pt-4">
          {#each feeGroups as group (group.label)}
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">{group.label}</p>
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

      <div class="mt-5 divide-y divide-stone-100">
        {#each data.installments as installment (installment.id)}
          <div class="flex flex-wrap items-center justify-between gap-2 py-3">
            <div class="flex items-center gap-2">
              {#if installment.status === "paid"}
                <CheckCircle2 class="h-4 w-4 text-brand-600" />
              {:else}
                <Clock class="h-4 w-4 text-amber-500" />
              {/if}
              <div>
                <p class="text-sm font-medium text-stone-800">
                  {data.invoice.scheme === "full" ? "Pembayaran penuh" : `Cicilan ke-${installment.sequence}`}
                </p>
                <p class="text-xs text-stone-600">Jatuh tempo {formatDate(installment.dueDate)}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-stone-900">{formatRupiah(installment.amount)}</p>
              <p class="text-xs {installment.status === 'paid' ? 'text-brand-700' : 'text-amber-600'}">
                {installment.status === "paid" ? "Lunas" : "Belum dibayar"}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </section>

    {#if data.invoice.status !== "paid" && data.registration.status !== "rejected" && data.registration.status !== "needs_revision"}
      <section class="mt-4 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <button
          type="button"
          onclick={() => (showForm = !showForm)}
          class="flex w-full items-center justify-between gap-3 text-left"
        >
          <span class="flex items-center gap-2 font-semibold text-stone-900">
            <Upload class="h-4 w-4 text-brand-700" /> Upload bukti pembayaran
          </span>
          <span class="text-xs text-stone-600">{showForm ? "Tutup" : "Buka"}</span>
        </button>

        {#if showForm}
          <form method="POST" action="?/upload" enctype="multipart/form-data" class="mt-4 space-y-4">
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-stone-700">Untuk pembayaran</span>
              <select
                name="installmentId"
                onchange={handleInstallmentChange}
                class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">Bayar sebagian / sisa tagihan</option>
                {#each unpaidInstallments as installment (installment.id)}
                  <option value={installment.id}>
                    {data.invoice.scheme === "full"
                      ? "Pembayaran penuh"
                      : `Cicilan ke-${installment.sequence}`} · {formatRupiah(installment.amount)}
                  </option>
                {/each}
              </select>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-stone-700">Nominal (Rp)</span>
                <input
                  name="amount"
                  type="number"
                  min="1"
                  step="1"
                  bind:value={amountValue}
                  required
                  class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-stone-700">Tanggal transfer</span>
                <input
                  name="paidAt"
                  type="date"
                  value={new Date().toISOString().slice(0, 10)}
                  class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-stone-700">Nomor referensi / berita transfer <span class="font-normal text-stone-600">(opsional)</span></span>
              <input name="referenceNumber" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-stone-700">Bukti pembayaran <span class="text-red-500">*</span></span>
              <input
                type="file"
                name="proof"
                accept="image/jpeg,image/png,application/pdf"
                required
                class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <span class="mt-1 block text-xs text-stone-600">JPG, PNG, atau PDF. Maksimal 5 MB.</span>
            </label>

            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              <Upload class="h-4 w-4" /> Kirim bukti
            </button>
          </form>
        {/if}
      </section>
    {/if}

    <section class="mt-4 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <h2 class="flex items-center gap-2 font-semibold text-stone-900">
        <FileCheck2 class="h-4 w-4 text-brand-700" /> Riwayat pembayaran
      </h2>

      {#if data.payments.length === 0}
        <p class="mt-3 text-sm text-stone-500">Belum ada pembayaran yang dikirim.</p>
      {:else}
        <div class="mt-3 divide-y divide-stone-100">
          {#each data.payments as payment (payment.id)}
            <div class="flex flex-wrap items-start justify-between gap-2 py-3">
              <div>
                <p class="text-sm font-medium text-stone-800">{formatRupiah(payment.amount)}</p>
                <p class="text-xs text-stone-600">
                  {payment.method === "cash" ? "Tunai" : "Transfer"} · dikirim {formatDateTime(payment.createdAt)}
                </p>
                {#if payment.status === "rejected" && payment.rejectionReason}
                  <p class="mt-1 text-xs text-red-600">{payment.rejectionReason}</p>
                {/if}
              </div>
              <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium {paymentClass[payment.status]}">
                {#if payment.status === "verified"}
                  <CheckCircle2 class="h-3.5 w-3.5" />
                {:else if payment.status === "rejected"}
                  <XCircle class="h-3.5 w-3.5" />
                {:else}
                  <Clock class="h-3.5 w-3.5" />
                {/if}
                {paymentLabel[payment.status]}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {:else}
    <section class="mt-4 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <p class="text-sm text-stone-600">
        Rincian biaya belum tersedia. Silakan hubungi pengurus pondok.
      </p>
    </section>
  {/if}

  <section class="mt-4 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Berkas digital</h2>
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      {#each DOCUMENT_ITEMS as item (item.key)}
        <div class="flex items-center gap-2 text-sm">
          {#if data.uploadedDocuments.includes(item.key)}
            <CheckCircle2 class="h-4 w-4 text-brand-600" />
            <span class="text-stone-800">{item.label}</span>
          {:else}
            <XCircle class="h-4 w-4 text-stone-300" />
            <span class="text-stone-600">{item.label}</span>
          {/if}
        </div>
      {/each}
    </div>
    <p class="mt-3 text-xs text-stone-600">
      Berkas fisik tetap dibawa saat mendaftar di asrama.
    </p>
  </section>

  <div class="mt-6 flex justify-center gap-3 print:hidden">
    <button
      type="button"
      onclick={() => window.print()}
      class="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
    >
      <Printer class="h-4 w-4" /> Cetak
    </button>
    <a
      href="/ppdb/sukses/{data.registration.code}"
      class="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
    >
      Lihat bukti pendaftaran
    </a>
  </div>
</div>
