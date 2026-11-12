<script lang="ts">
  import { ArrowLeft, MapPin, Save, Unlink } from "@lucide/svelte";
  import { formatDate, formatDateTime } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const statusLabel: Record<string, string> = {
    active: "Aktif",
    graduated: "Lulus",
    left: "Keluar"
  };

  let selectedRoom = $state("");
  let selectedLocker = $state("");

  $effect(() => {
    selectedRoom = data.currentPlacement ? String(data.currentPlacement.roomId) : "";
    selectedLocker = data.currentPlacement?.lockerId
      ? String(data.currentPlacement.lockerId)
      : "";
  });

  const lockerOptions = $derived(
    data.availableRooms.find((room) => String(room.id) === selectedRoom)?.lockers ?? []
  );

  function changeRoom(event: Event) {
    selectedRoom = (event.currentTarget as HTMLSelectElement).value;
    selectedLocker = "";
  }
</script>

<svelte:head><title>{data.santri.fullName} | Data Santri</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
  <div>
    <a href="/admin/santri" class="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
      <ArrowLeft class="h-3.5 w-3.5" /> Data santri
    </a>
    <h1 class="mt-2 text-2xl font-semibold text-stone-900">{data.santri.fullName}</h1>
    <p class="font-mono text-sm text-stone-500">
      {data.registration.code}{data.santri.nis ? ` · NIS ${data.santri.nis}` : ""}
    </p>
  </div>
  <div class="flex flex-wrap gap-2">
    <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
      {data.categoryName}
    </span>
    <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
      {data.academicYear}
    </span>
    <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
      {statusLabel[data.santri.status]}
    </span>
  </div>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<div class="mt-5 grid gap-4 lg:grid-cols-2">
  <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="font-semibold text-stone-900">Identitas santri</h2>
    {#if data.canManage}
      <form method="POST" action="?/update" class="mt-3 space-y-3">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">NIS</span>
          <input name="nis" value={data.santri.nis ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Status</span>
          <select name="status" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="active" selected={data.santri.status === "active"}>Aktif</option>
            <option value="graduated" selected={data.santri.status === "graduated"}>Lulus</option>
            <option value="left" selected={data.santri.status === "left"}>Keluar</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Catatan</span>
          <textarea name="notes" rows="2" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">{data.santri.notes ?? ""}</textarea>
        </label>
        <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900">
          <Save class="h-4 w-4" /> Simpan
        </button>
      </form>
    {:else}
      <dl class="mt-3 divide-y divide-stone-100 text-sm">
        <div class="flex justify-between gap-4 py-2">
          <dt class="text-stone-500">NIS</dt>
          <dd class="text-stone-900">{data.santri.nis || "-"}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <dt class="text-stone-500">Status</dt>
          <dd class="text-stone-900">{statusLabel[data.santri.status]}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2">
          <dt class="text-stone-500">Catatan</dt>
          <dd class="text-right text-stone-900">{data.santri.notes || "-"}</dd>
        </div>
      </dl>
    {/if}
  </section>

  <section class="rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="flex items-center gap-2 font-semibold text-stone-900">
      <MapPin class="h-4 w-4 text-brand-700" /> Penempatan asrama
    </h2>

    {#if data.currentPlacement}
      <div class="mt-3 rounded-lg bg-brand-50 p-4 text-sm">
        <p class="font-semibold text-brand-900">
          {data.currentPlacement.buildingName} · {data.currentPlacement.roomName}
        </p>
        <p class="mt-1 text-brand-800">
          Loker: {data.currentPlacement.lockerCode || "belum diisi"}
        </p>
        <p class="mt-1 text-xs text-brand-700">
          Mulai {formatDate(data.currentPlacement.startedAt)}
        </p>
      </div>
    {:else}
      <p class="mt-3 rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
        Santri belum ditempatkan di kamar.
      </p>
    {/if}

    {#if data.canManage}
      <form method="POST" action="?/assign" class="mt-4 space-y-3 border-t border-stone-100 pt-4">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Kamar</span>
          <select
            name="roomId"
            value={selectedRoom}
            onchange={changeRoom}
            required
            class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Pilih kamar</option>
            {#each data.availableRooms as room (room.id)}
              <option value={room.id}>
                {room.buildingName} · {room.name}{room.capacity > 0 ? ` (kapasitas ${room.capacity})` : ""}
              </option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Loker</span>
          <select
            name="lockerId"
            bind:value={selectedLocker}
            class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Tanpa loker</option>
            {#each lockerOptions as locker (locker.id)}
              <option value={locker.id}>{locker.code}</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-stone-500">Catatan</span>
          <input name="notes" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            <Save class="h-4 w-4" /> Simpan penempatan
          </button>
          {#if data.currentPlacement}
            <button
              type="submit"
              formaction="?/release"
              class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              onclick={(event) => {
                if (!confirm("Lepas penempatan santri ini?")) event.preventDefault();
              }}
            >
              <Unlink class="h-4 w-4" /> Lepas
            </button>
          {/if}
        </div>
      </form>
    {/if}
  </section>
</div>

<section class="mt-4 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="font-semibold text-stone-900">Riwayat penempatan</h2>
  {#if data.history.length === 0}
    <p class="mt-2 text-sm text-stone-500">Belum ada riwayat.</p>
  {:else}
    <div class="mt-3 divide-y divide-stone-100">
      {#each data.history as item (item.id)}
        <div class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <div>
            <p class="font-medium text-stone-800">{item.buildingName} · {item.roomName}</p>
            <p class="text-xs text-stone-500">
              Loker {item.lockerCode || "-"}{item.notes ? ` · ${item.notes}` : ""}
            </p>
          </div>
          <p class="text-xs text-stone-500">
            {formatDateTime(item.startedAt)} sampai {item.endedAt ? formatDateTime(item.endedAt) : "sekarang"}
          </p>
        </div>
      {/each}
    </div>
  {/if}
</section>
