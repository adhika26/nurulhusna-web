<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { ArrowLeft, ArrowRight, Check, Loader2, Save, Send } from "@lucide/svelte";
  import StudentFields from "./StudentFields.svelte";
  import GuardianFields from "./GuardianFields.svelte";
  import AddressStep from "./AddressStep.svelte";
  import DocumentsStep from "./DocumentsStep.svelte";
  import ReviewStep from "./ReviewStep.svelte";
  import {
    createEmptyDraft,
    WIZARD_STEPS,
    type RegistrationDraft
  } from "$lib/types/registration";

  let {
    category,
    academicYear,
    total,
    mode = "online",
    categoryHref = "/ppdb",
    endpoint = "/api/ppdb/registrations"
  }: {
    category: { code: string; name: string; institutionName: string };
    academicYear: string;
    total: number;
    mode?: "online" | "offline";
    categoryHref?: string;
    endpoint?: string;
  } = $props();

  const storageKey = $derived(`ppdb-draft-${mode}-${category.code}`);

  let draft = $state<RegistrationDraft>(createEmptyDraft(""));
  let step = $state(1);
  let photo = $state<File | null>(null);
  let photoPreview = $state("");
  let documents = $state<Record<string, File>>({});
  let errors = $state<string[]>([]);
  let submitting = $state(false);
  let hydrated = $state(false);
  let savedAt = $state<Date | null>(null);

  onMount(() => {
    const base = createEmptyDraft(category.code);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<RegistrationDraft>;
        draft = {
          ...base,
          ...parsed,
          categoryCode: category.code
        };
      } else {
        draft = base;
      }
    } catch {
      draft = base;
    }
    hydrated = true;
  });

  $effect(() => {
    if (!browser || !hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(draft));
    savedAt = new Date();
  });

  const current = $derived(WIZARD_STEPS.find((item) => item.id === step) ?? WIZARD_STEPS[0]);
  const progress = $derived(Math.round(((step - 1) / (WIZARD_STEPS.length - 1)) * 100));

  function handlePhoto(file: File | null) {
    photo = file;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    photoPreview = file ? URL.createObjectURL(file) : "";
  }

  function validate(): string[] {
    const messages: string[] = [];
    const s = draft.student;

    if (s.fullName.trim().length < 3) messages.push("Nama lengkap calon santri wajib diisi.");
    if (!s.gender) messages.push("Jenis kelamin wajib dipilih.");
    if (!s.birthPlace.trim()) messages.push("Tempat lahir wajib diisi.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.birthDate)) messages.push("Tanggal lahir wajib diisi.");
    if (!s.religion) messages.push("Agama wajib dipilih.");
    if (!/^\d{16}$/.test(s.nik)) messages.push("NIK santri harus 16 digit.");
    if (!/^\d{16}$/.test(s.kkNumber)) messages.push("Nomor Kartu Keluarga harus 16 digit.");
    if (!/^\d{10}$/.test(s.nisn)) messages.push("NISN harus 10 digit.");
    if (!s.schoolName.trim()) messages.push("Asal sekolah / madrasah wajib diisi.");
    if (s.schoolNpsn && !/^\d{8}$/.test(s.schoolNpsn)) messages.push("NPSN harus 8 digit.");
    if (s.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) {
      messages.push("Format email tidak valid.");
    }

    for (const [label, guardian] of [
      ["ayah", draft.father],
      ["ibu", draft.mother]
    ] as const) {
      if (guardian.name.trim().length < 2) messages.push(`Nama ${label} wajib diisi.`);
      if (!/^\d{16}$/.test(guardian.nik)) messages.push(`NIK ${label} harus 16 digit.`);
    }

    const a = draft.fatherAddress;
    if (!a.province.trim() || !a.regency.trim() || !a.district.trim() || !a.village.trim()) {
      messages.push("Alamat ayah (provinsi, kabupaten/kota, kecamatan, desa) wajib dilengkapi.");
    }

    if (!draft.studentAddressSame) {
      const b = draft.studentAddress;
      if (!b.province.trim() || !b.regency.trim() || !b.district.trim() || !b.village.trim()) {
        messages.push("Alamat santri wajib dilengkapi, atau centang 'sama dengan alamat ayah'.");
      }
    }

    if (draft.wali && (!draft.wali.name.trim() || !draft.wali.relationship)) {
      messages.push("Data wali belum lengkap.");
    }

    if (!s.phone.trim() && !draft.father.phone.trim() && !draft.mother.phone.trim()) {
      messages.push("Isi minimal satu nomor HP (santri, ayah, atau ibu) untuk cek status.");
    }

    return messages;
  }

  function toPayload() {
    const s = draft.student;
    return {
      categoryCode: category.code,
      scheme: draft.scheme,
      student: {
        ...s,
        siblingCount: s.siblingCount || "",
        birthOrder: s.birthOrder || ""
      },
      father: { ...draft.father, monthlyIncome: draft.father.monthlyIncome || "" },
      mother: { ...draft.mother, monthlyIncome: draft.mother.monthlyIncome || "" },
      wali: draft.wali,
      fatherAddress: {
        ...draft.fatherAddress,
        distanceKm: draft.fatherAddress.distanceKm || "",
        travelMinutes: draft.fatherAddress.travelMinutes || ""
      },
      studentAddressSame: draft.studentAddressSame,
      studentAddress: draft.studentAddressSame
        ? null
        : {
            ...draft.studentAddress,
            distanceKm: draft.studentAddress.distanceKm || "",
            travelMinutes: draft.studentAddress.travelMinutes || ""
          },
      checklist: draft.checklist
    };
  }

  async function submit() {
    errors = validate();
    if (errors.length > 0) return;

    submitting = true;
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(toPayload()));
      if (photo) formData.append("photo", photo);
      for (const [key, file] of Object.entries(documents)) {
        formData.append(`doc:${key}`, file);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const issues = Array.isArray(result.issues)
          ? result.issues.map((issue: { message: string }) => issue.message)
          : [];
        errors = [result.message ?? "Pendaftaran gagal dikirim.", ...new Set(issues)];
        submitting = false;
        return;
      }

      localStorage.removeItem(storageKey);

      if (mode === "offline" && result.id) {
        await goto(`/admin/pendaftaran/${result.id}`);
      } else {
        await goto(`/ppdb/sukses/${result.code}`);
      }
    } catch {
      errors = ["Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi."];
      submitting = false;
    }
  }

  function goNext() {
    errors = [];
    if (step < WIZARD_STEPS.length) step += 1;
    else submit();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    errors = [];
    if (step > 1) step -= 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function jumpTo(target: number) {
    errors = [];
    step = target;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDraft() {
    if (!confirm("Hapus semua isian pendaftaran?")) return;
    draft = createEmptyDraft(category.code);
    photo = null;
    photoPreview = "";
    documents = {};
    step = 1;
    errors = [];
    localStorage.removeItem(storageKey);
  }
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
  <div class="mb-6">
    <a href={categoryHref} class="text-sm font-medium text-brand-700 hover:underline">← Pilih kategori lain</a>
    <h1 class="mt-2 text-2xl font-bold text-stone-900">Formulir Pendaftaran Santri Baru</h1>
    <p class="mt-1 text-sm text-stone-500">
      {category.institutionName} · Tahun ajaran {academicYear}
    </p>
  </div>

  <div class="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
    <aside class="mb-5 lg:mb-0">
      <div class="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <div class="hidden items-center gap-3 lg:flex">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white">
            NH
          </div>
          <div>
            <p class="text-sm font-semibold text-stone-900">Nurul Husna</p>
            <p class="text-xs text-stone-500">Pendaftaran {academicYear}</p>
          </div>
        </div>

        <div class="mt-4 lg:mt-5">
          <div class="h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div class="h-full rounded-full bg-brand-600 transition-all" style="width: {progress}%"></div>
          </div>
          <p class="mt-2 text-xs text-stone-400">Langkah {step} dari {WIZARD_STEPS.length}</p>
        </div>

        <ol class="mt-4 space-y-1">
          {#each WIZARD_STEPS as item (item.id)}
            <li>
              <button
                type="button"
                onclick={() => jumpTo(item.id)}
                class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition {item.id === step
                  ? 'bg-brand-50'
                  : 'hover:bg-stone-50'}"
              >
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold {item.id < step
                    ? 'bg-brand-700 text-white'
                    : item.id === step
                      ? 'bg-brand-700 text-white'
                      : 'border border-stone-300 bg-white text-stone-500'}"
                >
                  {#if item.id < step}
                    <Check class="h-3.5 w-3.5" />
                  {:else}
                    {item.id}
                  {/if}
                </span>
                <span>
                  <span class="block text-sm font-medium {item.id === step ? 'text-brand-800' : 'text-stone-700'}">
                    {item.title}
                  </span>
                  <span class="block text-xs text-stone-400">{item.subtitle}</span>
                </span>
              </button>
            </li>
          {/each}
        </ol>

        <div class="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-400">
          <p class="flex items-center gap-1.5">
            <Save class="h-3.5 w-3.5" />
            {#if savedAt}
              Tersimpan otomatis di perangkat ini
            {:else}
              Isian tersimpan otomatis di perangkat ini
            {/if}
          </p>
          <button type="button" onclick={resetDraft} class="mt-2 text-red-600 hover:underline">
            Hapus semua isian
          </button>
        </div>
      </div>
    </aside>

    <section class="rounded-2xl bg-white p-5 ring-1 ring-stone-200 sm:p-7">
      {#if errors.length > 0}
        <div class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p class="text-sm font-semibold text-red-800">Periksa kembali isian berikut:</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {#each errors as message (message)}
              <li>{message}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if step === 1}
        <StudentFields {draft} {photoPreview} onPhoto={handlePhoto} />
      {:else if step === 2}
        <GuardianFields
          guardian={draft.father}
          title="Data ayah kandung"
          description="Isi sesuai KTP dan Kartu Keluarga."
          withKks
        />
      {:else if step === 3}
        <GuardianFields
          guardian={draft.mother}
          title="Data ibu kandung"
          description="Isi sesuai KTP dan Kartu Keluarga."
        />
      {:else if step === 4}
        <AddressStep {draft} />
      {:else if step === 5}
        <DocumentsStep
          {documents}
          onSelect={(key, file) => {
            if (file) {
              documents = { ...documents, [key]: file };
            } else {
              const next = { ...documents };
              delete next[key];
              documents = next;
            }
          }}
        />
      {:else}
        <ReviewStep {draft} {documents} {total} onEdit={jumpTo} />
      {/if}

      <div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
        <button
          type="button"
          onclick={goBack}
          disabled={step === 1 || submitting}
          class="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft class="h-4 w-4" /> Kembali
        </button>

        {#if step < WIZARD_STEPS.length}
          <button
            type="button"
            onclick={goNext}
            class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Lanjut <ArrowRight class="h-4 w-4" />
          </button>
        {:else}
          <button
            type="button"
            onclick={goNext}
            disabled={submitting}
            class="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {#if submitting}
              <Loader2 class="h-4 w-4 animate-spin" /> Mengirim…
            {:else}
              <Send class="h-4 w-4" /> Kirim pendaftaran
            {/if}
          </button>
        {/if}
      </div>
    </section>
  </div>
</div>
