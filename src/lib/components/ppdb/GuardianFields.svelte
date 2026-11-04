<script lang="ts">
  import {
    EDUCATION_OPTIONS,
    type GuardianDraft
  } from "$lib/types/registration";

  let {
    guardian,
    title,
    description,
    withKks = false
  }: {
    guardian: GuardianDraft;
    title: string;
    description: string;
    withKks?: boolean;
  } = $props();

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
</script>

<h2 class="text-xl font-semibold text-stone-900">{title}</h2>
<p class="mt-1 text-sm text-stone-500">{description}</p>

<div class="mt-6 space-y-6">
  <section>
    <h3 class="text-sm font-semibold text-stone-800">Identitas</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nama lengkap <span class="text-red-500">*</span></span>
        <input bind:value={guardian.name} class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Huruf kapital, sesuai KTP.</span>
      </label>
      <div class="sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Status <span class="text-red-500">*</span></span>
        <div class="grid gap-2 sm:grid-cols-3">
          <label class="flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm {guardian.status === 'alive' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-stone-300 bg-white text-stone-700'}">
            <input type="radio" bind:group={guardian.status} value="alive" class="sr-only" />
            Masih hidup
          </label>
          <label class="flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm {guardian.status === 'deceased' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-stone-300 bg-white text-stone-700'}">
            <input type="radio" bind:group={guardian.status} value="deceased" class="sr-only" />
            Sudah meninggal
          </label>
          <label class="flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm {guardian.status === 'unknown' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-stone-300 bg-white text-stone-700'}">
            <input type="radio" bind:group={guardian.status} value="unknown" class="sr-only" />
            Tidak diketahui
          </label>
        </div>
      </div>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Kewarganegaraan</span>
        <select bind:value={guardian.nationality} class={inputClass}>
          <option value="WNI">WNI</option>
          <option value="WNA">WNA</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">NIK <span class="text-red-500">*</span></span>
        <input bind:value={guardian.nik} maxlength="16" inputmode="numeric" class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">16 digit, tertera di KTP.</span>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Tempat lahir <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={guardian.birthPlace} class={inputClass} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Tanggal lahir <span class="font-normal text-stone-400">(opsional)</span></span>
        <input type="date" bind:value={guardian.birthDate} class={inputClass} />
      </label>
    </div>
  </section>

  <section class="border-t border-stone-100 pt-6">
    <h3 class="text-sm font-semibold text-stone-800">Pendidikan dan pekerjaan</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Pendidikan terakhir <span class="font-normal text-stone-400">(opsional)</span></span>
        <select bind:value={guardian.lastEducation} class={inputClass}>
          <option value="">Pilih</option>
          {#each EDUCATION_OPTIONS as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Pekerjaan utama <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={guardian.occupation} class={inputClass} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Penghasilan per bulan <span class="font-normal text-stone-400">(opsional)</span></span>
        <div class="flex items-center gap-2">
          <span class="text-sm text-stone-500">Rp</span>
          <input bind:value={guardian.monthlyIncome} inputmode="numeric" class={inputClass} />
        </div>
      </label>
    </div>
  </section>

  <section class="border-t border-stone-100 pt-6">
    <h3 class="text-sm font-semibold text-stone-800">Kontak</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nomor HP <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={guardian.phone} inputmode="tel" class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Nomor yang bisa dihubungi.</span>
      </label>
      {#if withKks}
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-stone-700">Nomor KKS / PKH <span class="font-normal text-stone-400">(opsional)</span></span>
          <input bind:value={guardian.kksNumber} class={inputClass} />
          <span class="mt-1 block text-xs text-stone-400">Kartu Keluarga Sejahtera atau Program Keluarga Harapan, jika ada.</span>
        </label>
      {/if}
    </div>
  </section>
</div>
