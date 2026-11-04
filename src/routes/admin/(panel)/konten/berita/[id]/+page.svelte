<script lang="ts">
  import { Save, Trash2 } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>{data.post.title} | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <a href="/admin/konten/berita" class="text-sm font-medium text-brand-700 hover:underline">← Berita</a>
    <h1 class="mt-2 text-2xl font-semibold text-stone-900">{data.post.title}</h1>
    <p class="font-mono text-xs text-stone-400">/{data.post.slug}</p>
  </div>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<form method="POST" action="?/update" enctype="multipart/form-data" class="mt-6 space-y-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <div class="grid gap-4 sm:grid-cols-2">
    <label class="block sm:col-span-2">
      <span class="mb-1 block text-sm font-medium text-stone-700">Judul</span>
      <input name="title" value={data.post.title} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Slug</span>
      <input name="slug" value={data.post.slug} class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Kategori</span>
      <select name="category" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="berita" selected={data.post.category === "berita"}>Berita</option>
        <option value="pengumuman" selected={data.post.category === "pengumuman"}>Pengumuman</option>
      </select>
    </label>
  </div>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Ringkasan</span>
    <textarea name="excerpt" rows="2" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">{data.post.excerpt ?? ""}</textarea>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Isi (Markdown)</span>
    <textarea name="content" rows="14" required class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm">{data.post.content}</textarea>
  </label>

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <span class="mb-1 block text-sm font-medium text-stone-700">Gambar sampul</span>
      {#if data.post.coverUrl}
        <img src={data.post.coverUrl} alt="Sampul berita" class="mb-2 aspect-[16/9] w-full max-w-xs rounded-lg object-cover" width="640" height="360" />
        <label class="flex items-center gap-2 text-xs text-stone-600">
          <input type="checkbox" name="removeCover" class="rounded" /> Hapus gambar sampul
        </label>
      {/if}
      <input type="file" name="cover" accept="image/jpeg,image/png" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </div>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Status</span>
      <select name="status" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="draft" selected={data.post.status === "draft"}>Draft</option>
        <option value="published" selected={data.post.status === "published"}>Terbit</option>
      </select>
    </label>
  </div>

  <div class="flex flex-wrap gap-3">
    <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
      <Save class="h-4 w-4" /> Simpan
    </button>
  </div>
</form>

<form
  method="POST"
  action="?/delete"
  class="mt-4"
  onsubmit={(event) => {
    if (!confirm("Hapus berita ini?")) event.preventDefault();
  }}
>
  <button type="submit" class="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
    <Trash2 class="h-4 w-4" /> Hapus berita
  </button>
</form>
