<script lang="ts">
  import { Eye, EyeOff, Plus, Trash2 } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Galeri | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Galeri</h1>
    <p class="mt-1 text-sm text-stone-500">Unggah foto kegiatan atau lingkungan pondok.</p>
  </div>
  <a href="/admin/konten" class="text-sm font-medium text-brand-700 hover:underline">← Konten</a>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<form method="POST" action="?/create" enctype="multipart/form-data" class="mt-6 grid gap-4 rounded-xl bg-white p-5 ring-1 ring-stone-200 sm:grid-cols-2">
  <h2 class="flex items-center gap-2 font-semibold text-stone-900 sm:col-span-2">
    <Plus class="h-4 w-4" /> Tambah foto
  </h2>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Foto <span class="text-red-500">*</span></span>
    <input type="file" name="image" accept="image/jpeg,image/png" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    <span class="mt-1 block text-xs text-stone-400">JPG atau PNG, maksimal 5 MB.</span>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Judul (opsional)</span>
    <input name="title" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
  </label>

  <label class="block sm:col-span-2">
    <span class="mb-1 block text-sm font-medium text-stone-700">Keterangan (opsional)</span>
    <input name="description" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Urutan</span>
    <input name="sortOrder" type="number" value="0" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
  </label>

  <label class="flex items-center gap-2 pt-6 text-sm text-stone-700">
    <input type="checkbox" name="isPublished" checked class="rounded" /> Tampilkan di galeri publik
  </label>

  <div class="sm:col-span-2">
    <button type="submit" class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
      Unggah foto
    </button>
  </div>
</form>

<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {#each data.items as item (item.id)}
    <div class="overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
      {#if item.imageUrl}
        <div class="aspect-[4/3] bg-stone-100">
          <img src={item.imageUrl} alt={item.title ?? "Foto galeri"} width="800" height="600" class="h-full w-full object-cover" />
        </div>
      {/if}
      <div class="p-4">
        <p class="font-medium text-stone-900">{item.title ?? "Tanpa judul"}</p>
        {#if item.description}
          <p class="mt-1 text-xs text-stone-500">{item.description}</p>
        {/if}
        <div class="mt-3 flex items-center gap-2">
          <form method="POST" action="?/toggle">
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">
              {#if item.isPublished}
                <EyeOff class="h-3.5 w-3.5" /> Sembunyikan
              {:else}
                <Eye class="h-3.5 w-3.5" /> Tampilkan
              {/if}
            </button>
          </form>
          <form
            method="POST"
            action="?/delete"
            onsubmit={(event) => {
              if (!confirm("Hapus foto ini dari galeri?")) event.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
              <Trash2 class="h-3.5 w-3.5" /> Hapus
            </button>
          </form>
        </div>
      </div>
    </div>
  {/each}
</div>

{#if data.items.length === 0}
  <p class="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
    Belum ada foto di galeri.
  </p>
{/if}
