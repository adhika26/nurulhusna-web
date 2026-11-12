<script lang="ts">
  import { AlertTriangle, Check } from "@lucide/svelte";
  import { formatRupiah } from "$lib/utils/format";
  import {
    CHECKLIST_ITEMS,
    DOCUMENT_ITEMS,
    type RegistrationDraft
  } from "$lib/types/registration";

  let {
    draft,
    documents,
    total,
    onEdit,
    allowSchemeChange = true
  }: {
    draft: RegistrationDraft;
    documents: Record<string, File>;
    total: number;
    onEdit: (step: number) => void;
    allowSchemeChange?: boolean;
  } = $props();

  type Row = { label: string; value: string; required?: boolean; emptyLabel?: string };

  const genderLabel = $derived(
    draft.student.gender === "male"
      ? "Laki-laki"
      : draft.student.gender === "female"
        ? "Perempuan"
        : ""
  );

  const statusLabel = (value: string) =>
    value === "alive" ? "Masih hidup" : value === "deceased" ? "Sudah meninggal" : value === "unknown" ? "Tidak diketahui" : "";

  const sections = $derived([
    {
      step: 1,
      title: "Data calon santri",
      rows: [
        { label: "Nama lengkap", value: draft.student.fullName, required: true },
        { label: "NISN", value: draft.student.nisn },
        { label: "NIS lokal", value: draft.student.localNis },
        { label: "NIK", value: draft.student.nik, required: true },
        { label: "Nomor Kartu Keluarga", value: draft.student.kkNumber, required: true },
        { label: "Kewarganegaraan", value: draft.student.nationality },
        { label: "Agama", value: draft.student.religion, required: true },
        { label: "Jenis kelamin", value: genderLabel, required: true },
        { label: "Tempat lahir", value: draft.student.birthPlace, required: true },
        { label: "Tanggal lahir", value: draft.student.birthDate, required: true },
        { label: "Jumlah saudara", value: draft.student.siblingCount },
        { label: "Anak ke", value: draft.student.birthOrder },
        { label: "Cita-cita", value: draft.student.aspiration },
        { label: "Hobi", value: draft.student.hobby },
        { label: "Nomor HP", value: draft.student.phone },
        { label: "Email", value: draft.student.email },
        { label: "Asal sekolah / madrasah", value: draft.student.schoolName, required: true },
        { label: "NPSN", value: draft.student.schoolNpsn },
        { label: "KIP", value: draft.student.kipNumber }
      ] as Row[]
    },
    {
      step: 2,
      title: "Data ayah kandung",
      rows: [
        { label: "Nama ayah", value: draft.father.name, required: true },
        { label: "Status", value: statusLabel(draft.father.status), required: true },
        { label: "Kewarganegaraan", value: draft.father.nationality },
        { label: "NIK", value: draft.father.nik, required: true },
        { label: "Tempat lahir", value: draft.father.birthPlace },
        { label: "Tanggal lahir", value: draft.father.birthDate },
        { label: "Pendidikan terakhir", value: draft.father.lastEducation },
        { label: "Pekerjaan utama", value: draft.father.occupation },
        { label: "Penghasilan per bulan", value: draft.father.monthlyIncome },
        { label: "Nomor HP", value: draft.father.phone },
        { label: "Nomor KKS / PKH", value: draft.father.kksNumber }
      ] as Row[]
    },
    {
      step: 3,
      title: "Data ibu kandung",
      rows: [
        { label: "Nama ibu", value: draft.mother.name, required: true },
        { label: "Status", value: statusLabel(draft.mother.status), required: true },
        { label: "Kewarganegaraan", value: draft.mother.nationality },
        { label: "NIK", value: draft.mother.nik, required: true },
        { label: "Tempat lahir", value: draft.mother.birthPlace },
        { label: "Tanggal lahir", value: draft.mother.birthDate },
        { label: "Pendidikan terakhir", value: draft.mother.lastEducation },
        { label: "Pekerjaan utama", value: draft.mother.occupation },
        { label: "Penghasilan per bulan", value: draft.mother.monthlyIncome },
        { label: "Nomor HP", value: draft.mother.phone }
      ] as Row[]
    },
    {
      step: 4,
      title: "Alamat dan jarak",
      rows: [
        { label: "Status kepemilikan rumah", value: draft.fatherAddress.ownershipStatus },
        { label: "Provinsi", value: draft.fatherAddress.province, required: true },
        { label: "Kabupaten / kota", value: draft.fatherAddress.regency, required: true },
        { label: "Kecamatan", value: draft.fatherAddress.district, required: true },
        { label: "Kelurahan / desa", value: draft.fatherAddress.village, required: true },
        { label: "RT / RW", value: [draft.fatherAddress.rt, draft.fatherAddress.rw].filter(Boolean).join(" / ") },
        { label: "Jalan / gang", value: draft.fatherAddress.street },
        { label: "Kode pos", value: draft.fatherAddress.postalCode },
        { label: "Jarak tempat tinggal", value: draft.fatherAddress.distanceKm ? `${draft.fatherAddress.distanceKm} km` : "" },
        { label: "Transportasi", value: draft.fatherAddress.transportation },
        { label: "Waktu tempuh", value: draft.fatherAddress.travelMinutes ? `${draft.fatherAddress.travelMinutes} menit` : "" },
        { label: "Alamat santri", value: draft.studentAddressSame ? "Sama dengan alamat ayah" : "Alamat terpisah" },
        { label: "Wali", value: draft.wali ? `${draft.wali.name} (${draft.wali.relationship})` : "Tidak ada" }
      ] as Row[]
    },
    {
      step: 5,
      title: "Berkas digital",
      rows: DOCUMENT_ITEMS.map((item) => ({
        label: item.label,
        value: documents[item.key]?.name ?? "",
        emptyLabel: "Tidak diunggah"
      })) as Row[]
    }
  ]);

  const missingBySection = $derived(
    sections.map((section) => ({
      step: section.step,
      title: section.title,
      count: section.rows.filter((row) => row.required && !row.value?.trim()).length
    }))
  );

  const totalMissing = $derived(missingBySection.reduce((sum, item) => sum + item.count, 0));

  function toggleChecklist(key: string, checked: boolean) {
    if (checked) {
      if (!draft.checklist.includes(key)) draft.checklist = [...draft.checklist, key];
    } else {
      draft.checklist = draft.checklist.filter((item) => item !== key);
    }
  }
</script>

<h2 class="text-xl font-semibold text-stone-900">Periksa dan kirim</h2>
<p class="mt-1 text-sm text-stone-500">
  Pastikan semua data benar. Setelah dikirim, kode pendaftaran akan diterbitkan.
</p>

{#if totalMissing > 0}
  <div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <p class="flex items-center gap-2 text-sm font-medium text-amber-900">
      <AlertTriangle class="h-4 w-4" />
      {totalMissing} isian wajib perlu dilengkapi atau diperbaiki
    </p>
    <div class="mt-2 flex flex-wrap gap-2">
      {#each missingBySection.filter((item) => item.count > 0) as item (item.step)}
        <button
          type="button"
          onclick={() => onEdit(item.step)}
          class="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          {item.title} ({item.count})
        </button>
      {/each}
    </div>
  </div>
{/if}

<div class="mt-5 space-y-4">
  {#each sections as section (section.step)}
    <section class="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div class="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-4 py-3">
        <h3 class="text-sm font-semibold text-stone-800">{section.title}</h3>
        <button
          type="button"
          onclick={() => onEdit(section.step)}
          class="rounded-lg border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
        >
          Ubah
        </button>
      </div>
      <dl class="divide-y divide-stone-100">
        {#each section.rows as row (row.label)}
          <div class="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5 text-sm">
            <dt class="text-stone-500">{row.label}</dt>
            <dd class="text-right {!row.value?.trim() && row.required
              ? 'font-medium text-red-600'
              : !row.value?.trim()
                ? 'text-stone-400'
                : 'text-stone-900'}">
              {row.value?.trim() ? row.value : row.required ? "Belum diisi" : (row.emptyLabel ?? "Tidak diisi")}
            </dd>
          </div>
        {/each}
      </dl>
    </section>
  {/each}

  <section class="rounded-xl border border-stone-200 bg-white p-4">
    <h3 class="text-sm font-semibold text-stone-800">Berkas yang dibawa saat mendaftar</h3>
    <p class="mt-1 text-xs text-stone-400">Centang untuk menandai berkas yang sudah siap.</p>
    <div class="mt-3 space-y-2">
      {#each CHECKLIST_ITEMS as item (item.key)}
        <label class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-50">
          <span class="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={draft.checklist.includes(item.key)}
              onchange={(event) => toggleChecklist(item.key, (event.currentTarget as HTMLInputElement).checked)}
              class="rounded"
            />
            {item.label}
          </span>
          <span class="text-xs text-stone-400">{item.count}</span>
        </label>
      {/each}
    </div>
  </section>

  <section class="rounded-xl border border-stone-200 bg-white p-4">
    <h3 class="text-sm font-semibold text-stone-800">Skema pembayaran</h3>
    {#if allowSchemeChange}
      <p class="mt-1 text-xs text-stone-400">Pilih cara pembayaran biaya pendaftaran.</p>
    {:else}
      <p class="mt-1 text-xs text-stone-400">
        Skema pembayaran tidak dapat diubah saat perbaikan data. Hubungi pengurus jika perlu diubah.
      </p>
    {/if}
    <div class="mt-3 grid gap-3 sm:grid-cols-2 {allowSchemeChange ? '' : 'pointer-events-none opacity-60'}">
      <label class="cursor-pointer rounded-xl border p-4 {draft.scheme === 'full' ? 'border-brand-500 bg-brand-50' : 'border-stone-200 bg-white hover:border-stone-300'}">
        <input type="radio" bind:group={draft.scheme} value="full" disabled={!allowSchemeChange} class="sr-only" />
        <span class="flex items-center justify-between">
          <span class="font-medium text-stone-900">Lunas</span>
          {#if draft.scheme === "full"}<Check class="h-4 w-4 text-brand-700" />{/if}
        </span>
        <span class="mt-1 block text-sm text-stone-600">Bayar sekali: <strong>{formatRupiah(total)}</strong></span>
      </label>
      <label class="cursor-pointer rounded-xl border p-4 {draft.scheme === 'installment_3' ? 'border-brand-500 bg-brand-50' : 'border-stone-200 bg-white hover:border-stone-300'}">
        <input type="radio" bind:group={draft.scheme} value="installment_3" disabled={!allowSchemeChange} class="sr-only" />
        <span class="flex items-center justify-between">
          <span class="font-medium text-stone-900">Cicilan 3×</span>
          {#if draft.scheme === "installment_3"}<Check class="h-4 w-4 text-brand-700" />{/if}
        </span>
        <span class="mt-1 block text-sm text-stone-600">
          ± {formatRupiah(Math.floor((total / 3) * 100) / 100)} per cicilan
        </span>
      </label>
    </div>
  </section>
</div>
