<script lang="ts">
  import { FileText, Paperclip, Trash2 } from "@lucide/svelte";
  import { DOCUMENT_ITEMS } from "$lib/types/registration";

  let {
    documents,
    onSelect
  }: {
    documents: Record<string, File>;
    onSelect: (key: string, file: File | null) => void;
  } = $props();

  let error = $state("");
  let resetToken = $state(0);

  const MAX_BYTES = 5 * 1024 * 1024;

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleFile(key: string, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (file.size > MAX_BYTES) {
      error = "Ukuran berkas maksimal 5 MB.";
      input.value = "";
      return;
    }

    error = "";
    onSelect(key, file);
  }

  function removeFile(key: string) {
    onSelect(key, null);
    resetToken += 1;
  }
</script>

<h2 class="text-xl font-semibold text-stone-900">Berkas pendukung</h2>
<p class="mt-1 text-sm text-stone-500">
  Unggah salinan dokumen jika sudah tersedia. Semua berkas <strong>opsional</strong> dan boleh
  menyusul dibawa langsung saat mendaftar di asrama.
</p>

{#if error}
  <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
{/if}

<div class="mt-5 space-y-2">
  {#each DOCUMENT_ITEMS as item (item.key)}
    {@const file = documents[item.key]}
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
          {#if file}
            <FileText class="h-4 w-4 text-brand-700" />
          {:else}
            <Paperclip class="h-4 w-4" />
          {/if}
        </span>
        <div>
          <p class="text-sm font-medium text-stone-800">{item.label}</p>
          {#if file}
            <p class="text-xs text-brand-700">{file.name} · {formatSize(file.size)}</p>
          {:else}
            <p class="text-xs text-stone-400">JPG, PNG, atau PDF · maks 5 MB</p>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if file}
          <button
            type="button"
            onclick={() => removeFile(item.key)}
            class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 class="h-3.5 w-3.5" /> Hapus
          </button>
        {:else}
          {#key resetToken}
            <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">
              <Paperclip class="h-3.5 w-3.5" /> Pilih berkas
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onchange={(event) => handleFile(item.key, event)}
                class="sr-only"
              />
            </label>
          {/key}
        {/if}
      </div>
    </div>
  {/each}
</div>

<p class="mt-4 text-xs text-stone-400">
  Berkas yang dipilih belum tersimpan di server sampai pendaftaran dikirim. Jika halaman dimuat
  ulang, berkas perlu dipilih kembali.
</p>
