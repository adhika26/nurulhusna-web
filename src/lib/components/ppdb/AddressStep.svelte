<script lang="ts">
  import AddressFields from "./AddressFields.svelte";
  import { RELATIONSHIP_OPTIONS, type RegistrationDraft } from "$lib/types/registration";

  let { draft }: { draft: RegistrationDraft } = $props();

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  function toggleWali(checked: boolean) {
    draft.wali = checked
      ? { name: "", relationship: "", phone: "", addressSame: true }
      : null;
  }
</script>

<h2 class="text-xl font-semibold text-stone-900">Alamat dan jarak ke pondok</h2>
<p class="mt-1 text-sm text-stone-500">
  Alamat tempat tinggal keluarga dan perjalanan menuju pondok.
</p>

<div class="mt-6 space-y-6">
  <section>
    <h3 class="text-sm font-semibold text-stone-800">Alamat ayah kandung</h3>
    <p class="mt-1 text-xs text-stone-400">Alamat lengkap sesuai Kartu Keluarga.</p>
    <div class="mt-3">
      <AddressFields address={draft.fatherAddress} idPrefix="father" />
    </div>
  </section>

  <section class="border-t border-stone-100 pt-6">
    <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
      <input
        type="checkbox"
        bind:checked={draft.studentAddressSame}
        class="mt-0.5 rounded"
      />
      <span class="text-sm text-stone-700">
        Alamat santri sama dengan alamat ayah kandung
      </span>
    </label>

    {#if !draft.studentAddressSame}
      <h3 class="mt-5 text-sm font-semibold text-stone-800">Alamat santri</h3>
      <div class="mt-3">
        <AddressFields address={draft.studentAddress} idPrefix="student" />
      </div>
    {/if}
  </section>

  <section class="border-t border-stone-100 pt-6">
    <h3 class="text-sm font-semibold text-stone-800">Wali</h3>
    <p class="mt-1 text-xs text-stone-400">
      Isi jika santri tinggal bersama wali selain ayah/ibu kandung.
    </p>

    <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-stone-700">
      <input
        type="checkbox"
        checked={draft.wali !== null}
        onchange={(event) => toggleWali((event.currentTarget as HTMLInputElement).checked)}
        class="rounded"
      />
      Santri memiliki wali
    </label>

    {#if draft.wali}
      <div class="mt-4 grid gap-4 sm:grid-cols-3">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Nama wali <span class="text-red-500">*</span></span>
          <input bind:value={draft.wali.name} class={inputClass} />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Hubungan <span class="text-red-500">*</span></span>
          <select bind:value={draft.wali.relationship} class={inputClass}>
            <option value="">Pilih</option>
            {#each RELATIONSHIP_OPTIONS as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Nomor HP</span>
          <input bind:value={draft.wali.phone} inputmode="tel" class={inputClass} />
        </label>
      </div>
      <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" bind:checked={draft.wali.addressSame} class="rounded" />
        Alamat wali sama dengan alamat ayah kandung
      </label>
    {/if}
  </section>
</div>
