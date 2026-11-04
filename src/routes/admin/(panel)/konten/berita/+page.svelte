<script lang="ts">
  import { Plus } from "@lucide/svelte";
  import { formatDateTime } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Berita | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Berita</h1>
    <p class="mt-1 text-sm text-stone-500">Tulis kabar atau pengumuman untuk halaman publik.</p>
  </div>
  <a href="/admin/konten" class="text-sm font-medium text-brand-700 hover:underline">← Konten</a>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form && "success" in form && form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<div class="mt-6 divide-y divide-stone-100 rounded-xl bg-white ring-1 ring-stone-200">
  {#each data.posts as post (post.id)}
    <a href="/admin/konten/berita/{post.id}" class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-stone-50">
      <div>
        <p class="font-medium text-stone-900">{post.title}</p>
        <p class="font-mono text-xs text-stone-400">/{post.slug} · {post.category}</p>
      </div>
      <div class="text-right">
        <span class="rounded px-2 py-0.5 text-xs font-medium {post.status === 'published' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'}">
          {post.status === "published" ? "Terbit" : "Draft"}
        </span>
        <p class="mt-1 text-xs text-stone-400">{formatDateTime(post.createdAt)}</p>
      </div>
    </a>
  {/each}

  {#if data.posts.length === 0}
    <p class="px-5 py-6 text-sm text-stone-500">Belum ada berita.</p>
  {/if}
</div>

<form method="POST" action="?/create" enctype="multipart/form-data" class="mt-6 space-y-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="flex items-center gap-2 font-semibold text-stone-900"><Plus class="h-4 w-4" /> Tulis berita baru</h2>

  <div class="grid gap-4 sm:grid-cols-2">
    <label class="block sm:col-span-2">
      <span class="mb-1 block text-sm font-medium text-stone-700">Judul</span>
      <input name="title" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Slug (opsional)</span>
      <input name="slug" placeholder="otomatis dari judul" class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Kategori</span>
      <select name="category" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="berita">Berita</option>
        <option value="pengumuman">Pengumuman</option>
      </select>
    </label>
  </div>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Ringkasan (opsional)</span>
    <textarea name="excerpt" rows="2" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"></textarea>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Isi (Markdown)</span>
    <textarea name="content" rows="10" required class="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm"></textarea>
  </label>

  <div class="grid gap-4 sm:grid-cols-2">
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Gambar sampul (opsional)</span>
      <input type="file" name="cover" accept="image/jpeg,image/png" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Status</span>
      <select name="status" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="draft">Draft</option>
        <option value="published">Terbit</option>
      </select>
    </label>
  </div>

  <button type="submit" class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
    Simpan berita
  </button>
</form>
