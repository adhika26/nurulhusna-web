<script lang="ts">
  import { Camera, User } from "@lucide/svelte";
  import { RELIGION_OPTIONS, type RegistrationDraft } from "$lib/types/registration";

  let {
    draft,
    photoPreview,
    onPhoto
  }: {
    draft: RegistrationDraft;
    photoPreview: string;
    onPhoto: (file: File | null) => void;
  } = $props();

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  function handleFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    onPhoto(input.files?.[0] ?? null);
  }
</script>

<h2 class="text-xl font-semibold text-stone-900">Data calon santri</h2>
<p class="mt-1 text-sm text-stone-500">
  Isi sesuai akta kelahiran dan Kartu Keluarga. Isian bertanda <span class="text-red-500">*</span> wajib diisi.
</p>

<div class="mt-6 space-y-6">
  <section>
    <h3 class="text-sm font-semibold text-stone-800">Identitas</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nama lengkap calon santri <span class="text-red-500">*</span></span>
        <input bind:value={draft.student.fullName} class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Huruf kapital, sesuai akta kelahiran.</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">NISN <span class="text-stone-400">(opsional)</span></span>
        <input bind:value={draft.student.nisn} maxlength="10" inputmode="numeric" class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Nomor Induk Siswa Nasional, 10 digit.</span>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">NIS lokal <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={draft.student.localNis} class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Kosongkan jika belum punya.</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">NIK <span class="text-red-500">*</span></span>
        <input bind:value={draft.student.nik} maxlength="16" inputmode="numeric" class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">16 digit, tertera di Kartu Keluarga.</span>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nomor Kartu Keluarga <span class="text-red-500">*</span></span>
        <input bind:value={draft.student.kkNumber} maxlength="16" inputmode="numeric" class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">16 digit.</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Kewarganegaraan</span>
        <select bind:value={draft.student.nationality} class={inputClass}>
          <option value="WNI">WNI</option>
          <option value="WNA">WNA</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Agama <span class="text-red-500">*</span></span>
        <select bind:value={draft.student.religion} class={inputClass}>
          <option value="">Pilih</option>
          {#each RELIGION_OPTIONS as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </label>

      <div class="sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Jenis kelamin <span class="text-red-500">*</span></span>
        <div class="grid gap-2 sm:grid-cols-2">
          <label class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm {draft.student.gender === 'male' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-stone-300 bg-white text-stone-700'}">
            <input type="radio" bind:group={draft.student.gender} value="male" class="sr-only" />
            <User class="h-4 w-4" /> Laki-laki
          </label>
          <label class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm {draft.student.gender === 'female' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-stone-300 bg-white text-stone-700'}">
            <input type="radio" bind:group={draft.student.gender} value="female" class="sr-only" />
            <User class="h-4 w-4" /> Perempuan
          </label>
        </div>
      </div>
    </div>
  </section>

  <section class="border-t border-stone-100 pt-6">
    <h3 class="text-sm font-semibold text-stone-800">Kelahiran dan keluarga</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Tempat lahir <span class="text-red-500">*</span></span>
        <input bind:value={draft.student.birthPlace} class={inputClass} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Tanggal lahir <span class="text-red-500">*</span></span>
        <input type="date" bind:value={draft.student.birthDate} class={inputClass} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Jumlah saudara</span>
        <div class="flex items-center gap-2">
          <input bind:value={draft.student.siblingCount} inputmode="numeric" class={inputClass} />
          <span class="text-sm text-stone-500">orang</span>
        </div>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Anak ke</span>
        <input bind:value={draft.student.birthOrder} inputmode="numeric" class={inputClass} />
      </label>
    </div>
  </section>

  <section class="border-t border-stone-100 pt-6">
    <h3 class="text-sm font-semibold text-stone-800">Kontak dan minat</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Cita-cita <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={draft.student.aspiration} class={inputClass} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Hobi <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={draft.student.hobby} class={inputClass} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Nomor HP <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={draft.student.phone} inputmode="tel" class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Jika ada.</span>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Alamat email <span class="font-normal text-stone-400">(opsional)</span></span>
        <input type="email" bind:value={draft.student.email} class={inputClass} />
      </label>
    </div>
  </section>

  <section class="border-t border-stone-100 pt-6">
    <h3 class="text-sm font-semibold text-stone-800">Sekolah asal</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-sm font-medium text-stone-700">Asal sekolah / madrasah <span class="text-red-500">*</span></span>
        <input bind:value={draft.student.schoolName} class={inputClass} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">NPSN <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={draft.student.schoolNpsn} maxlength="8" inputmode="numeric" class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Nomor Pokok Sekolah Nasional, 8 digit.</span>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-stone-700">Kartu Indonesia Pintar (KIP) <span class="font-normal text-stone-400">(opsional)</span></span>
        <input bind:value={draft.student.kipNumber} class={inputClass} />
        <span class="mt-1 block text-xs text-stone-400">Nomor KIP, jika ada.</span>
      </label>
    </div>
  </section>

  <section class="border-t border-stone-100 pt-6">
    <h3 class="text-sm font-semibold text-stone-800">Pas foto 3 × 4</h3>
    <p class="mt-1 text-sm text-stone-500">Latar merah. Format JPG atau PNG, maksimal 5 MB.</p>
    <div class="mt-3 flex items-start gap-4">
      <div class="flex h-32 w-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50">
        {#if photoPreview}
          <img src={photoPreview} alt="Pratinjau pas foto" class="h-full w-full object-cover" />
        {:else}
          <Camera class="h-7 w-7 text-stone-300" />
        {/if}
      </div>
      <div>
        <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
          <Camera class="h-4 w-4" /> Pilih foto
          <input type="file" accept="image/jpeg,image/png" onchange={handleFile} class="sr-only" />
        </label>
        <p class="mt-2 text-xs text-stone-400">Opsional. Foto dipakai untuk kartu pendaftaran.</p>
      </div>
    </div>
  </section>
</div>
