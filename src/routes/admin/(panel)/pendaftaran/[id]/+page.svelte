<script lang="ts">
  import { CheckCircle2, ExternalLink, Phone, Save, UserCheck, Wallet, XCircle } from "@lucide/svelte";
  import { CHECKLIST_ITEMS, DOCUMENT_ITEMS } from "$lib/types/registration";
  import { formatDate, formatDateTime, formatRupiah } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const reg = $derived(data.registration);
  const father = $derived(data.guardians.find((item) => item.type === "father") ?? null);
  const mother = $derived(data.guardians.find((item) => item.type === "mother") ?? null);
  const wali = $derived(data.guardians.find((item) => item.type === "guardian") ?? null);
  const fatherAddress = $derived(data.addresses.find((item) => item.type === "father") ?? null);
  const studentAddress = $derived(data.addresses.find((item) => item.type === "student") ?? null);

  const checkedKeys = $derived(
    new Set(data.checklist.filter((item) => item.isChecked).map((item) => item.itemKey))
  );

  const uploadedDocuments = $derived(
    new Map(data.documents.map((document) => [document.itemKey, document]))
  );

  const paidAmount = $derived(
    data.payments
      .filter((payment) => payment.status === "verified")
      .reduce((sum, payment) => sum + payment.amount, 0)
  );

  const remaining = $derived(data.invoice ? Math.max(data.invoice.totalAmount - paidAmount, 0) : 0);

  const unpaidInstallments = $derived(
    data.installments.filter((item) => item.status === "unpaid")
  );

  let showReject = $state(false);
  let selectedInstallment = $state("");
  let cashAmount = $state(0);

  $effect(() => {
    cashAmount = remaining;
  });

  function handleCashInstallment(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    selectedInstallment = id;
    const installment = data.installments.find((item) => item.id === id);
    cashAmount = installment ? installment.amount : remaining;
  }

  const statusLabel: Record<string, string> = {
    submitted: "Terkirim",
    verified: "Terverifikasi",
    accepted: "Diterima",
    rejected: "Ditolak",
    checked_in: "Check-in",
    draft: "Draft"
  };

  const genderLabel = $derived(reg.gender === "male" ? "Laki-laki" : "Perempuan");

  const studentRows = $derived<Array<[string, string | null]>>([
    ["Nama lengkap", reg.fullName],
    ["NISN", reg.nisn],
    ["NIS lokal", reg.localNis],
    ["NIK", reg.nik],
    ["Nomor KK", reg.kkNumber],
    ["Jenis kelamin", genderLabel],
    ["Tempat, tanggal lahir", `${reg.birthPlace}, ${formatDate(reg.birthDate)}`],
    ["Agama", reg.religion],
    ["Kewarganegaraan", reg.nationality],
    ["Jumlah saudara / anak ke", [reg.siblingCount, reg.birthOrder].filter((value) => value !== null).join(" / ")],
    ["Cita-cita", reg.aspiration],
    ["Hobi", reg.hobby],
    ["Nomor HP", reg.phone],
    ["Email", reg.email],
    ["Asal sekolah", reg.schoolName],
    ["NPSN", reg.schoolNpsn],
    ["KIP", reg.kipNumber]
  ]);

  function personRows(
    person: (typeof data.guardians)[number] | null
  ): Array<[string, string | null]> {
    if (!person) return [];
    return [
      ["Nama", person.name],
      [
        "Status",
        person.status === "alive"
          ? "Masih hidup"
          : person.status === "deceased"
            ? "Sudah meninggal"
            : "Tidak diketahui"
      ],
      ["NIK", person.nik],
      ["Pekerjaan", person.occupation],
      ["Penghasilan", person.monthlyIncome ? formatRupiah(Number(person.monthlyIncome)) : null],
      ["Nomor HP", person.phone],
      ["KKS / PKH", person.kksNumber],
      ["Hubungan", person.relationship]
    ];
  }

  const guardianGroups = $derived(
    [
      { title: "Ayah kandung", rows: personRows(father) },
      { title: "Ibu kandung", rows: personRows(mother) },
      { title: "Wali", rows: personRows(wali) }
    ].filter((group) => group.rows.length > 0)
  );
</script>

<svelte:head><title>{reg.fullName} | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
  <div>
    <a href="/admin/pendaftaran" class="text-sm font-medium text-brand-700 hover:underline">← Daftar pendaftar</a>
    <h1 class="mt-2 text-2xl font-semibold text-stone-900">{reg.fullName}</h1>
    <p class="font-mono text-sm text-stone-500">{reg.code}</p>
  </div>
  <div class="flex flex-wrap gap-2">
    <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
      {data.category?.name ?? "-"}
    </span>
    <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
      {statusLabel[reg.status] ?? reg.status}
    </span>
    <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
      {reg.source === "offline" ? "Input offline" : "Online"}
    </span>
  </div>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-3 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<section class="mt-5 rounded-xl bg-white p-4 ring-1 ring-stone-200">
  <div class="flex flex-wrap items-center gap-2">
    {#if reg.status === "submitted"}
      <form method="POST" action="?/status">
        <input type="hidden" name="status" value="verified" />
        <button class="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-900">
          <CheckCircle2 class="h-3.5 w-3.5" /> Verifikasi data
        </button>
      </form>
    {/if}

    {#if reg.status === "submitted" || reg.status === "verified"}
      <form method="POST" action="?/status">
        <input type="hidden" name="status" value="accepted" />
        <button class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">
          <UserCheck class="h-3.5 w-3.5" /> Terima santri
        </button>
      </form>
    {/if}

    {#if reg.status === "accepted"}
      <form method="POST" action="?/status">
        <input type="hidden" name="status" value="checked_in" />
        <button class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">
          <CheckCircle2 class="h-3.5 w-3.5" /> Check-in asrama
        </button>
      </form>
    {/if}

    {#if reg.status !== "rejected"}
      {#if showReject}
        <form method="POST" action="?/status" class="flex flex-wrap items-center gap-2">
          <input type="hidden" name="status" value="rejected" />
          <input name="reason" placeholder="Alasan penolakan" required class="rounded-lg border border-stone-300 px-3 py-1.5 text-xs" />
          <button class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Tolak</button>
          <button type="button" onclick={() => (showReject = false)} class="text-xs text-stone-500 hover:underline">Batal</button>
        </form>
      {:else}
        <button
          type="button"
          onclick={() => (showReject = true)}
          class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <XCircle class="h-3.5 w-3.5" /> Tolak
        </button>
      {/if}
    {/if}

    <span class="ml-auto text-xs text-stone-400">Didaftarkan {formatDateTime(reg.createdAt)}</span>
  </div>

  {#if reg.status === "rejected" && reg.rejectionReason}
    <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Alasan: {reg.rejectionReason}</p>
  {/if}
</section>

<div class="mt-5 grid gap-4 lg:grid-cols-2">
  <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Data santri</h2>
    <dl class="mt-3 divide-y divide-stone-100">
      {#each studentRows as [label, value]}
        <div class="flex justify-between gap-4 py-2 text-sm">
          <dt class="text-stone-500">{label}</dt>
          <dd class="text-right text-stone-900">{value || "-"}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <div class="space-y-4">
    {#each guardianGroups as group (group.title)}
      <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <h2 class="font-semibold text-stone-900">{group.title}</h2>
        <dl class="mt-3 divide-y divide-stone-100">
          {#each group.rows as [label, value]}
            <div class="flex justify-between gap-4 py-2 text-sm">
              <dt class="text-stone-500">{label}</dt>
              <dd class="text-right text-stone-900">{value || "-"}</dd>
            </div>
          {/each}
        </dl>
      </section>
    {/each}
  </div>
</div>

<section class="mt-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="font-semibold text-stone-900">Alamat</h2>
  {#if fatherAddress}
    <p class="mt-2 text-sm text-stone-700">
      {[
        fatherAddress.street,
        fatherAddress.rt ? `RT ${fatherAddress.rt}` : null,
        fatherAddress.rw ? `RW ${fatherAddress.rw}` : null,
        fatherAddress.village,
        fatherAddress.district,
        fatherAddress.regency,
        fatherAddress.province,
        fatherAddress.postalCode
      ]
        .filter(Boolean)
        .join(", ")}
    </p>
    <p class="mt-1 text-xs text-stone-500">
      Kepemilikan: {fatherAddress.ownershipStatus || "-"} · Jarak: {fatherAddress.distanceKm ?? "-"} km ·
      Transportasi: {fatherAddress.transportation || "-"} · Waktu: {fatherAddress.travelMinutes ?? "-"} menit
    </p>
  {/if}
  {#if studentAddress}
    <p class="mt-3 text-sm text-stone-600">
      <span class="font-medium text-stone-700">Alamat santri:</span>
      {[studentAddress.street, studentAddress.village, studentAddress.district, studentAddress.regency, studentAddress.province]
        .filter(Boolean)
        .join(", ")}
    </p>
  {/if}
</section>

<section class="mt-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="font-semibold text-stone-900">Kelengkapan berkas fisik</h2>
  <div class="mt-3 grid gap-2 sm:grid-cols-2">
    {#each CHECKLIST_ITEMS as item (item.key)}
      <div class="flex items-center gap-2 text-sm">
        {#if checkedKeys.has(item.key)}
          <CheckCircle2 class="h-4 w-4 text-brand-600" />
          <span class="text-stone-800">{item.label}</span>
        {:else}
          <span class="h-4 w-4 rounded-full border border-stone-300"></span>
          <span class="text-stone-400">{item.label}</span>
        {/if}
      </div>
    {/each}
  </div>
</section>

<section class="mt-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="font-semibold text-stone-900">Berkas digital (opsional)</h2>
  <div class="mt-3 grid gap-2 sm:grid-cols-2">
    {#each DOCUMENT_ITEMS as item (item.key)}
      {@const document = uploadedDocuments.get(item.key)}
      <div class="flex items-start gap-2 text-sm">
        {#if document}
          <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div>
            <a
              href="/admin/pendaftaran/berkas/{document.id}"
              target="_blank"
              rel="noopener"
              class="font-medium text-brand-700 hover:underline"
            >
              {item.label}
            </a>
            <p class="text-xs text-stone-400">{document.originalName ?? "Berkas"}</p>
          </div>
        {:else}
          <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-stone-300"></span>
          <span class="text-stone-400">{item.label}</span>
        {/if}
      </div>
    {/each}
  </div>
</section>

{#if data.invoice}
  <section class="mt-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="flex items-center gap-2 font-semibold text-stone-900">
      <Wallet class="h-4 w-4 text-brand-700" /> Tagihan & pembayaran
    </h2>
    <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-stone-50 p-4">
      <div>
        <p class="text-xs text-stone-500">Total tagihan</p>
        <p class="text-xl font-semibold text-stone-900">{formatRupiah(data.invoice.totalAmount)}</p>
        <p class="text-xs text-stone-500">{data.invoice.scheme === "installment_3" ? "Cicilan 3×" : "Lunas"}</p>
      </div>
      <div class="text-right">
        <p class="text-xs text-stone-500">Terverifikasi</p>
        <p class="text-lg font-semibold text-brand-700">{formatRupiah(paidAmount)}</p>
        <p class="text-xs text-amber-600">Sisa {formatRupiah(remaining)}</p>
      </div>
    </div>

    <div class="mt-4 divide-y divide-stone-100">
      {#each data.installments as installment (installment.id)}
        <div class="flex items-center justify-between gap-2 py-2 text-sm">
          <span class="text-stone-700">
            {data.invoice.scheme === "full" ? "Pembayaran penuh" : `Cicilan ke-${installment.sequence}`}
            <span class="text-xs text-stone-400">· jatuh tempo {formatDate(installment.dueDate)}</span>
          </span>
          <span class="flex items-center gap-3">
            <span class="font-medium text-stone-900">{formatRupiah(installment.amount)}</span>
            <span class="text-xs {installment.status === 'paid' ? 'text-brand-700' : 'text-amber-600'}">
              {installment.status === "paid" ? "Lunas" : "Belum"}
            </span>
          </span>
        </div>
      {/each}
    </div>

    {#if data.payments.length > 0}
      <div class="mt-4 border-t border-stone-100 pt-4">
        <h3 class="text-sm font-semibold text-stone-800">Riwayat pembayaran</h3>
        <div class="mt-2 divide-y divide-stone-100">
          {#each data.payments as payment (payment.id)}
            <div class="flex items-center justify-between gap-2 py-2 text-sm">
              <div>
                <p class="text-stone-800">{formatRupiah(payment.amount)} · {payment.method === "cash" ? "Tunai" : "Transfer"}</p>
                <p class="text-xs text-stone-400">{formatDateTime(payment.createdAt)}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs {payment.status === 'verified' ? 'text-brand-700' : payment.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}">
                  {payment.status === "verified" ? "Terverifikasi" : payment.status === "rejected" ? "Ditolak" : "Pending"}
                </span>
                {#if payment.proofPath}
                  <a href="/admin/pembayaran/bukti/{payment.id}" target="_blank" rel="noopener" class="text-brand-700">
                    <ExternalLink class="h-3.5 w-3.5" />
                  </a>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if remaining > 0}
      <form method="POST" action="?/cash" class="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-4 sm:items-end">
        <input type="hidden" name="invoiceId" value={data.invoice.id} />
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs font-medium text-stone-500">Catat pembayaran tunai</span>
          <select name="installmentId" onchange={handleCashInstallment} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="">Sebagian / sisa tagihan</option>
            {#each unpaidInstallments as installment (installment.id)}
              <option value={installment.id}>
                {data.invoice.scheme === "full" ? "Pembayaran penuh" : `Cicilan ke-${installment.sequence}`} · {formatRupiah(installment.amount)}
              </option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Nominal (Rp)</span>
          <input name="amount" type="number" min="1" step="1000" bind:value={cashAmount} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" class="rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900">
          Catat tunai
        </button>
        <label class="block sm:col-span-4">
          <input name="note" placeholder="Catatan (opsional)" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
      </form>
    {/if}
  </section>
{:else}
  <section class="mt-4 rounded-xl border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-500">
    Pendaftaran ini belum memiliki tagihan. Lengkapi paket biaya untuk kategori ini.
  </section>
{/if}

<section class="mt-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="font-semibold text-stone-900">Catatan pengurus</h2>
  <form method="POST" action="?/notes" class="mt-3">
    <textarea name="notes" rows="3" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">{reg.notes ?? ""}</textarea>
    <button type="submit" class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-900">
      <Save class="h-3.5 w-3.5" /> Simpan catatan
    </button>
  </form>
</section>

{#if reg.phone}
  <p class="mt-4 flex items-center gap-2 text-sm text-stone-500">
    <Phone class="h-4 w-4" /> {reg.phone}
  </p>
{/if}
