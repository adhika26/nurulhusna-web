<script lang="ts">
  import { Plus, Save, Trash2, Wallet } from "@lucide/svelte";
  import { formatRupiah } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Paket Biaya | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Paket Biaya</h1>
    <p class="mt-1 text-sm text-stone-500">
      Nominal di sini dipakai untuk membuat tagihan otomatis saat santri mendaftar.
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

<form method="GET" class="mt-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Gelombang</span>
    <select name="wave" class="rounded-lg border border-stone-300 px-3 py-2 text-sm" required>
      <option value="">Pilih gelombang</option>
      {#each data.waves as wave (wave.id)}
        <option value={wave.id} selected={data.waveId === wave.id}>
          {wave.name} · {wave.academicYear}
        </option>
      {/each}
    </select>
  </label>
  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Kategori</span>
    <select name="category" class="rounded-lg border border-stone-300 px-3 py-2 text-sm" required>
      <option value="">Pilih kategori</option>
      {#each data.categories as category (category.id)}
        <option value={category.id} selected={data.categoryId === category.id}>{category.name}</option>
      {/each}
    </select>
  </label>
  <button type="submit" class="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900">
    Tampilkan
  </button>
</form>

{#if data.waveId && data.categoryId && !data.plan}
  <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-stone-300 bg-white p-5">
    <p class="text-sm text-stone-600">Kategori ini belum punya paket biaya pada gelombang terpilih.</p>
    <form method="POST" action="?/createPlan">
      <input type="hidden" name="waveId" value={data.waveId} />
      <input type="hidden" name="categoryId" value={data.categoryId} />
      <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
        <Plus class="h-4 w-4" /> Buat paket biaya
      </button>
    </form>
  </div>
{/if}

{#if data.plan}
  <div class="mt-4 rounded-xl bg-white ring-1 ring-stone-200">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
      <div>
        <p class="font-semibold text-stone-900">{data.plan.name}</p>
        <p class="text-sm text-stone-500">{data.items.length} komponen · {formatRupiah(data.total)} total wajib</p>
      </div>
      <div class="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">
        <Wallet class="h-4 w-4" /> {formatRupiah(data.total)}
      </div>
    </div>

    <div class="divide-y divide-stone-100">
      {#each data.items as item (item.id)}
        <form method="POST" action="?/updateItem" class="grid gap-3 px-5 py-4 sm:grid-cols-12 sm:items-end">
          <input type="hidden" name="id" value={item.id} />
          <label class="block sm:col-span-4">
            <span class="mb-1 block text-xs font-medium text-stone-500">Nama komponen</span>
            <input name="name" value={item.name} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label class="block sm:col-span-3">
            <span class="mb-1 block text-xs font-medium text-stone-500">Nominal (Rp)</span>
            <input name="amount" type="number" min="0" step="1000" value={item.amount} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs font-medium text-stone-500">Cakupan</span>
            <select name="scope" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
              <option value="pondok" selected={item.scope === "pondok"}>Pondok</option>
              <option value="sekolah" selected={item.scope === "sekolah"}>Sekolah</option>
            </select>
          </label>
          <label class="block sm:col-span-1">
            <span class="mb-1 block text-xs font-medium text-stone-500">Urutan</span>
            <input name="sortOrder" type="number" value={item.sortOrder} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <div class="flex items-center gap-2 sm:col-span-2">
            <label class="flex items-center gap-1.5 text-xs text-stone-600">
              <input type="checkbox" name="isMandatory" checked={item.isMandatory} class="rounded" />
              Wajib
            </label>
          </div>
          <div class="flex gap-2 sm:col-span-12">
            <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-900">
              <Save class="h-3.5 w-3.5" /> Simpan
            </button>
            <button
              type="submit"
              formaction="?/deleteItem"
              class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              onclick={(event) => {
                if (!confirm("Hapus komponen ini?")) event.preventDefault();
              }}
            >
              <Trash2 class="h-3.5 w-3.5" /> Hapus
            </button>
          </div>
        </form>
      {/each}

      {#if data.items.length === 0}
        <p class="px-5 py-6 text-sm text-stone-500">Belum ada komponen biaya. Tambahkan di bawah.</p>
      {/if}
    </div>

    <form method="POST" action="?/addItem" class="grid gap-3 border-t border-stone-100 bg-stone-50/60 px-5 py-4 sm:grid-cols-12 sm:items-end">
      <input type="hidden" name="feePlanId" value={data.plan.id} />
      <label class="block sm:col-span-4">
        <span class="mb-1 block text-xs font-medium text-stone-500">Komponen baru</span>
        <input name="name" placeholder="contoh: Uang pangkal" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block sm:col-span-3">
        <span class="mb-1 block text-xs font-medium text-stone-500">Nominal (Rp)</span>
        <input name="amount" type="number" min="0" step="1000" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-xs font-medium text-stone-500">Cakupan</span>
        <select name="scope" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
          <option value="pondok">Pondok</option>
          <option value="sekolah">Sekolah</option>
        </select>
      </label>
      <label class="block sm:col-span-1">
        <span class="mb-1 block text-xs font-medium text-stone-500">Urutan</span>
        <input name="sortOrder" type="number" value={data.items.length + 1} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="flex items-center gap-1.5 pb-2 text-xs text-stone-600 sm:col-span-2">
        <input type="checkbox" name="isMandatory" checked class="rounded" />
        Wajib dibayar
      </label>
      <div class="sm:col-span-12">
        <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          <Plus class="h-4 w-4" /> Tambah komponen
        </button>
      </div>
    </form>
  </div>
{/if}
