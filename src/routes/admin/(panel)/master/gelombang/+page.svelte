<script lang="ts">
  import { CalendarClock, CheckCircle2, Plus, Save, XCircle } from "@lucide/svelte";
  import { formatDate, toDateTimeInput } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const stateLabel: Record<string, string> = {
    dibuka: "Dibuka",
    "akan datang": "Akan datang",
    ditutup: "Ditutup",
    nonaktif: "Nonaktif"
  };

  const stateClass: Record<string, string> = {
    dibuka: "bg-brand-50 text-brand-700",
    "akan datang": "bg-blue-50 text-blue-700",
    ditutup: "bg-stone-100 text-stone-500",
    nonaktif: "bg-red-50 text-red-600"
  };
</script>

<svelte:head><title>Gelombang | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Gelombang Pendaftaran</h1>
    <p class="mt-1 text-sm text-stone-500">
      Pendaftaran otomatis dibuka/ditutup sesuai tanggal. Boleh ada lebih dari satu gelombang aktif.
    </p>
  </div>
  <a href="/admin/master" class="text-sm font-medium text-brand-700 hover:underline">← Data master</a>
</div>

{#if form?.message}
  <p
    class="mt-4 rounded-lg px-3 py-2 text-sm {form.success
      ? 'bg-brand-50 text-brand-800'
      : 'bg-red-50 text-red-700'}"
  >
    {form.message}
  </p>
{/if}

<div class="mt-6 space-y-3">
  {#each data.waves as wave (wave.id)}
    <div class="rounded-xl bg-white ring-1 ring-stone-200">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold text-stone-900">{wave.name}</span>
            {#if wave.code}
              <span class="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-stone-600">
                {wave.code}
              </span>
            {/if}
            <span class="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {wave.academicYear}
            </span>
            <span class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium {stateClass[wave.state]}">
              {#if wave.state === "dibuka"}
                <CheckCircle2 class="h-3.5 w-3.5" />
              {:else if wave.state === "nonaktif" || wave.state === "ditutup"}
                <XCircle class="h-3.5 w-3.5" />
              {:else}
                <CalendarClock class="h-3.5 w-3.5" />
              {/if}
              {stateLabel[wave.state]}
            </span>
          </div>
          <p class="mt-1 text-sm text-stone-500">
            {formatDate(wave.opensAt)} sampai {formatDate(wave.closesAt)}
          </p>
        </div>

        <form method="POST" action="?/toggle">
          <input type="hidden" name="id" value={wave.id} />
          <button
            type="submit"
            class="rounded-lg border px-3 py-1.5 text-sm font-medium {wave.isActive
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-brand-200 text-brand-700 hover:bg-brand-50'}"
          >
            {wave.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </form>
      </div>

      <form method="POST" action="?/update" class="grid gap-4 px-5 py-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={wave.id} />
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Tahun ajaran</span>
          <input name="academicYear" value={wave.academicYear} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Nama gelombang</span>
          <input name="name" value={wave.name} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Kode gelombang</span>
          <input name="code" value={wave.code ?? ""} placeholder="G1" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <span class="mt-1 block text-xs text-stone-400">Label singkat gelombang, mis. G1.</span>
        </label>
        <div class="hidden sm:block"></div>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Dibuka</span>
          <input type="datetime-local" name="opensAt" value={toDateTimeInput(wave.opensAt)} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Ditutup</span>
          <input type="datetime-local" name="closesAt" value={toDateTimeInput(wave.closesAt)} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <div class="sm:col-span-2">
          <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900">
            <Save class="h-4 w-4" /> Simpan perubahan
          </button>
        </div>
      </form>
    </div>
  {/each}
</div>

<form method="POST" action="?/create" class="mt-6 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="flex items-center gap-2 font-semibold text-stone-900">
    <Plus class="h-4 w-4" /> Tambah gelombang
  </h2>
  <div class="mt-4 grid gap-4 sm:grid-cols-2">
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Tahun ajaran</span>
      <input name="academicYear" placeholder="2026/2027" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Nama gelombang</span>
      <input name="name" placeholder="Gelombang 3" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Kode gelombang</span>
      <input name="code" placeholder="G3" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <div class="hidden sm:block"></div>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Dibuka</span>
      <input type="datetime-local" name="opensAt" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Ditutup</span>
      <input type="datetime-local" name="closesAt" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
  </div>
  <button type="submit" class="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
    Tambah gelombang
  </button>
</form>
