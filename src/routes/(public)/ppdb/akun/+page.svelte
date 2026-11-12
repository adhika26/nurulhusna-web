<script lang="ts">
  import { ClipboardList, LogOut, Plus, ReceiptText } from "@lucide/svelte";
  import { formatDate, formatRupiah } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

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

  const invoiceLabel: Record<string, string> = {
    unpaid: "Belum dibayar",
    partial: "Dibayar sebagian",
    paid: "Lunas",
    cancelled: "Dibatalkan"
  };
</script>

<svelte:head>
  <title>Akun Saya | PPDB</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p class="text-sm font-medium uppercase tracking-wider text-brand-700">Akun PPDB</p>
      <h1 class="mt-1 text-2xl font-bold text-stone-900">{data.account.fullName}</h1>
      <p class="font-mono text-sm text-stone-500">{data.account.phone}</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        href="/ppdb"
        class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
      >
        <Plus class="h-4 w-4" /> Daftar santri baru
      </a>
      <form method="POST" action="/ppdb/akun/keluar">
        <button
          type="submit"
          class="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          <LogOut class="h-4 w-4" /> Keluar
        </button>
      </form>
    </div>
  </div>

  {#if data.registrations.length === 0}
    <div class="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <ClipboardList class="mx-auto h-8 w-8 text-stone-300" />
      <p class="mt-3 text-sm text-stone-500">
        Belum ada pendaftaran. Pilih kategori santri untuk mulai mendaftar.
      </p>
      <a href="/ppdb" class="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline">
        Lihat kategori pendaftaran
      </a>
    </div>
  {:else}
    <div class="mt-8 space-y-4">
      {#each data.registrations as registration (registration.id)}
        <section class="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-stone-900">{registration.fullName}</p>
              <p class="font-mono text-xs text-stone-500">{registration.code}</p>
              <p class="mt-1 text-sm text-stone-500">
                {registration.categoryName} · {registration.academicYear}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-stone-500">Status pendaftaran</p>
              <p class="text-sm font-semibold text-brand-700">
                {statusLabel[registration.status] ?? registration.status}
              </p>
              <p class="mt-1 text-xs text-stone-400">
                Didaftarkan {formatDate(registration.createdAt)}
              </p>
            </div>
          </div>

          {#if registration.status === "rejected"}
            <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              Alasan ditolak: {registration.rejectionReason || "Hubungi pengurus pondok."}
            </p>
          {:else if registration.status === "needs_revision"}
            <div class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p>Perlu diperbaiki: {registration.revisionNote || "Lengkapi data pendaftaran."}</p>
              <a
                href="/ppdb/akun/pendaftaran/{registration.id}/revisi"
                class="mt-1 inline-flex font-semibold text-amber-900 hover:underline"
              >
                Perbaiki data sekarang
              </a>
            </div>
          {/if}

          {#if registration.invoiceStatus}
            <div class="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-3">
              <div>
                <p class="text-xs text-stone-500">Total tagihan</p>
                <p class="font-semibold text-stone-900">{formatRupiah(registration.total)}</p>
              </div>
              <div>
                <p class="text-xs text-stone-500">Sudah dibayar</p>
                <p class="font-semibold text-brand-700">{formatRupiah(registration.paid)}</p>
              </div>
              <div>
                <p class="text-xs text-stone-500">Status</p>
                <p class="font-semibold {registration.invoiceStatus === 'paid' ? 'text-brand-700' : 'text-amber-600'}">
                  {invoiceLabel[registration.invoiceStatus] ?? registration.invoiceStatus}
                </p>
              </div>
            </div>
          {/if}

          <div class="mt-4 flex flex-wrap gap-2">
            <a
              href="/ppdb/status/{registration.code}"
              class="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <ClipboardList class="h-3.5 w-3.5" /> Lihat status
            </a>
            {#if registration.paid > 0}
              <a
                href="/ppdb/kuitansi/{registration.code}"
                class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                <ReceiptText class="h-3.5 w-3.5" /> Kuitansi
              </a>
            {/if}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</div>
