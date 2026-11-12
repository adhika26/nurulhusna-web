<script lang="ts">
  import { GraduationCap, MapPin, Search } from "@lucide/svelte";
  import { formatDate } from "$lib/utils/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const statusLabel: Record<string, string> = {
    active: "Aktif",
    graduated: "Lulus",
    left: "Keluar"
  };

  const statusClass: Record<string, string> = {
    active: "bg-brand-50 text-brand-700",
    graduated: "bg-blue-50 text-blue-700",
    left: "bg-stone-100 text-stone-600"
  };
</script>

<svelte:head><title>Data Santri | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Data Santri</h1>
    <p class="mt-1 text-sm text-stone-500">
      Santri aktif yang sudah lunas dan lengkap berkasnya.
    </p>
  </div>
</div>

<div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Total</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.counts.total}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Aktif</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.counts.active}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Putra</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.counts.male}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Putri</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.counts.female}</p>
  </div>
</div>

<form method="GET" class="mt-5 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
  <label class="block flex-1">
    <span class="mb-1 block text-xs font-medium text-stone-500">Cari nama atau NIS</span>
    <div class="flex items-center gap-2 rounded-lg border border-stone-300 px-3">
      <Search class="h-4 w-4 text-stone-400" />
      <input name="q" value={data.filters.q} placeholder="Nama santri" class="w-full bg-transparent py-2 text-sm outline-none" />
    </div>
  </label>
  <label class="block">
    <span class="mb-1 block text-xs font-medium text-stone-500">Status</span>
    <select name="status" class="rounded-lg border border-stone-300 px-3 py-2 text-sm">
      <option value="" selected={!data.filters.status}>Semua</option>
      <option value="active" selected={data.filters.status === "active"}>Aktif</option>
      <option value="graduated" selected={data.filters.status === "graduated"}>Lulus</option>
      <option value="left" selected={data.filters.status === "left"}>Keluar</option>
    </select>
  </label>
  <button type="submit" class="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900">
    Cari
  </button>
</form>

<div class="mt-5 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
  {#if data.santri.length === 0}
    <div class="p-8 text-center">
      <GraduationCap class="mx-auto h-8 w-8 text-stone-300" />
      <p class="mt-2 text-sm text-stone-500">
        Belum ada data santri. Data dibuat otomatis saat cicilan pertama terverifikasi dan berkas lengkap.
      </p>
    </div>
  {:else}
    <div class="divide-y divide-stone-100">
      {#each data.santri as row (row.id)}
        <a href="/admin/santri/{row.id}" class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-stone-50">
          <div class="min-w-48">
            <p class="font-semibold text-stone-900">{row.fullName}</p>
            <p class="font-mono text-xs text-stone-400">
              {row.registrationCode}{row.nis ? ` · NIS ${row.nis}` : ""}
            </p>
            <p class="text-xs text-stone-500">{row.categoryName} · {row.academicYear}</p>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-xs">
            <span class="rounded-full px-2 py-0.5 font-medium {statusClass[row.status]}">
              {statusLabel[row.status]}
            </span>
            <span class="text-stone-500">Sejak {formatDate(row.joinedAt)}</span>
            {#if row.hasPlacement}
              <span class="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-stone-700">
                <MapPin class="h-3 w-3" />
                {row.buildingName} · {row.roomName}
                {#if row.lockerCode}· Loker {row.lockerCode}{/if}
              </span>
            {:else}
              <span class="rounded bg-amber-50 px-2 py-0.5 text-amber-700">Belum ditempatkan</span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
