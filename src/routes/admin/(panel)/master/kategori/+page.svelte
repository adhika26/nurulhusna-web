<script lang="ts">
  import { ChevronDown, Save } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const levelLabels: Record<string, string> = {
    mi: "MI",
    mts: "MTs",
    none: "Tanpa sekolah formal"
  };
</script>

<svelte:head><title>Kategori Santri | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Kategori Santri</h1>
    <p class="mt-1 text-sm text-stone-500">
      Kode kategori dipakai pada kode pendaftaran dan tidak dapat diubah.
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
  {#each data.categories as category (category.id)}
    <details class="group rounded-xl bg-white ring-1 ring-stone-200">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-stone-700">
              {category.code}
            </span>
            <span class="font-semibold text-stone-900">{category.name}</span>
            {#if !category.isActive}
              <span class="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">nonaktif</span>
            {/if}
          </div>
          <p class="mt-1 text-sm text-stone-500">
            {category.institutionName} · {levelLabels[category.educationLevel]}
            {#if category.gradeRange}· kelas {category.gradeRange}{/if}
          </p>
        </div>
        <ChevronDown class="h-5 w-5 shrink-0 text-stone-400 transition group-open:rotate-180" />
      </summary>

      <form method="POST" action="?/update" class="border-t border-stone-100 px-5 py-5">
        <input type="hidden" name="id" value={category.id} />
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-stone-700">Nama kategori</span>
            <input
              name="name"
              value={category.name}
              required
              class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-stone-700">Nama lembaga (header form)</span>
            <input
              name="institutionName"
              value={category.institutionName}
              required
              class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-stone-700">Jenjang</span>
            <select name="educationLevel" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
              <option value="mi" selected={category.educationLevel === "mi"}>MI</option>
              <option value="mts" selected={category.educationLevel === "mts"}>MTs</option>
              <option value="none" selected={category.educationLevel === "none"}>Tanpa sekolah formal</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-stone-700">Rentang kelas</span>
            <input
              name="gradeRange"
              value={category.gradeRange ?? ""}
              placeholder="contoh: 1-3"
              class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-sm font-medium text-stone-700">Deskripsi singkat</span>
            <textarea
              name="description"
              rows="2"
              class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >{category.description ?? ""}</textarea>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-stone-700">Urutan tampil</span>
            <input
              name="sortOrder"
              type="number"
              value={category.sortOrder}
              class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label class="flex items-center gap-2 pt-6 text-sm text-stone-700">
            <input type="checkbox" name="isActive" checked={category.isActive} class="rounded" />
            Tampilkan di halaman pendaftaran
          </label>
        </div>
        <button
          type="submit"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          <Save class="h-4 w-4" /> Simpan
        </button>
      </form>
    </details>
  {/each}
</div>
