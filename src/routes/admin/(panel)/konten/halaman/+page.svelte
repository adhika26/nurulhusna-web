<script lang="ts">
  import { ChevronDown, Save } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Halaman | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Halaman</h1>
    <p class="mt-1 text-sm text-stone-500">
      Isi halaman memakai Markdown sederhana: <code class="rounded bg-stone-100 px-1">## Judul</code>,
      <code class="rounded bg-stone-100 px-1">- daftar</code>, <code class="rounded bg-stone-100 px-1">**tebal**</code>.
    </p>
  </div>
  <a href="/admin/konten" class="text-sm font-medium text-brand-700 hover:underline">← Konten</a>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<div class="mt-6 space-y-3">
  {#each data.pages as page (page.id)}
    <details class="group rounded-xl bg-white ring-1 ring-stone-200">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <div>
          <span class="font-medium text-stone-900">{page.title}</span>
          <span class="ml-2 font-mono text-xs text-stone-400">/{page.slug}</span>
          {#if !page.isPublished}
            <span class="ml-2 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">draft</span>
          {/if}
        </div>
        <ChevronDown class="h-5 w-5 text-stone-400 transition group-open:rotate-180" />
      </summary>

      <form method="POST" action="?/update" class="grid gap-4 border-t border-stone-100 px-5 py-5">
        <input type="hidden" name="id" value={page.id} />
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-stone-700">Judul</span>
            <input name="title" value={page.title} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-stone-700">Slug</span>
            <input name="slug" value={page.slug} class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Isi (Markdown)</span>
          <textarea name="content" rows="12" required class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm">{page.content}</textarea>
        </label>
        <label class="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="isPublished" checked={page.isPublished} class="rounded" />
          Terbitkan halaman
        </label>
        <button type="submit" class="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          <Save class="h-4 w-4" /> Simpan
        </button>
      </form>
    </details>
  {/each}
</div>

<form method="POST" action="?/create" class="mt-6 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="font-semibold text-stone-900">Tambah halaman</h2>
  <div class="mt-4 grid gap-4 sm:grid-cols-2">
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Judul</span>
      <input name="title" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Slug (opsional)</span>
      <input name="slug" placeholder="otomatis dari judul" class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm" />
    </label>
  </div>
  <label class="mt-4 block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Isi (Markdown)</span>
    <textarea name="content" rows="8" required class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm"></textarea>
  </label>
  <label class="mt-3 flex items-center gap-2 text-sm text-stone-700">
    <input type="checkbox" name="isPublished" checked class="rounded" /> Terbitkan halaman
  </label>
  <button type="submit" class="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
    Tambah halaman
  </button>
</form>
