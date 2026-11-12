<script lang="ts">
  import { Building2, DoorOpen, KeyRound, Plus, Save, Trash2 } from "@lucide/svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const genderLabel: Record<string, string> = {
    male: "Putra",
    female: "Putri"
  };
</script>

<svelte:head><title>Asrama | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Asrama</h1>
    <p class="mt-1 text-sm text-stone-500">
      Data gedung, kamar, dan loker untuk penempatan santri.
    </p>
  </div>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Gedung</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.stats.buildings}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Kamar</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.stats.rooms}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Loker</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.stats.lockers}</p>
  </div>
  <div class="rounded-xl bg-white p-4 ring-1 ring-stone-200">
    <p class="text-xs uppercase tracking-wide text-stone-500">Santri ditempatkan</p>
    <p class="mt-1 text-2xl font-semibold text-stone-900">{data.stats.occupants}</p>
  </div>
</div>

{#if !data.canManage}
  <p class="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
    Anda hanya dapat melihat data asrama.
  </p>
{/if}

{#if data.canManage}
  <section class="mt-6 rounded-xl bg-white p-5 ring-1 ring-stone-200">
    <h2 class="flex items-center gap-2 font-semibold text-stone-900">
      <Building2 class="h-4 w-4 text-brand-700" /> Tambah gedung
    </h2>
    <form method="POST" action="?/createBuilding" class="mt-3 grid gap-3 sm:grid-cols-5 sm:items-end">
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-stone-500">Kode</span>
        <input name="code" placeholder="A" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-xs font-medium text-stone-500">Nama gedung</span>
        <input name="name" placeholder="Gedung A" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-stone-500">Jenis kelamin</span>
        <select name="gender" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
          <option value="male">Putra</option>
          <option value="female">Putri</option>
        </select>
      </label>
      <button type="submit" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800">
        <Plus class="h-4 w-4" /> Tambah
      </button>
      <label class="block sm:col-span-5">
        <span class="mb-1 block text-xs font-medium text-stone-500">Catatan (opsional)</span>
        <input name="notes" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      </label>
    </form>
  </section>
{/if}

<div class="mt-5 space-y-3">
  {#each data.buildings as building (building.id)}
    <details class="group rounded-xl bg-white ring-1 ring-stone-200">
      <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-stone-700">{building.code}</span>
          <span class="font-semibold text-stone-900">{building.name}</span>
          <span class="rounded-full px-2 py-0.5 text-xs font-medium {building.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}">
            {genderLabel[building.gender]}
          </span>
          {#if !building.isActive}
            <span class="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">nonaktif</span>
          {/if}
        </div>
        <p class="text-xs text-stone-500">{building.roomCount} kamar · {building.lockerCount} loker</p>
      </summary>

      <div class="border-t border-stone-100 px-5 py-4">
        {#if data.canManage}
          <form method="POST" action="?/updateBuilding" class="grid gap-3 sm:grid-cols-5 sm:items-end">
            <input type="hidden" name="id" value={building.id} />
            <label class="block sm:col-span-2">
              <span class="mb-1 block text-xs font-medium text-stone-500">Nama gedung</span>
              <input name="name" value={building.name} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-stone-500">Jenis kelamin</span>
              <select name="gender" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
                <option value="male" selected={building.gender === "male"}>Putra</option>
                <option value="female" selected={building.gender === "female"}>Putri</option>
              </select>
            </label>
            <label class="flex items-center gap-2 pb-2 text-sm text-stone-700">
              <input type="checkbox" name="isActive" checked={building.isActive} class="rounded" />
              Aktif
            </label>
            <button type="submit" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900">
              <Save class="h-4 w-4" /> Simpan
            </button>
            <label class="block sm:col-span-5">
              <span class="mb-1 block text-xs font-medium text-stone-500">Catatan</span>
              <input name="notes" value={building.notes ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>
          </form>
        {/if}

        <div class="mt-4 space-y-3">
          {#each building.rooms as room (room.id)}
            <details class="rounded-lg border border-stone-200">
              <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div class="flex flex-wrap items-center gap-2">
                  <DoorOpen class="h-4 w-4 text-stone-400" />
                  <span class="font-medium text-stone-900">{room.name}</span>
                  {#if !room.isActive}
                    <span class="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">nonaktif</span>
                  {/if}
                </div>
                <p class="text-xs text-stone-500">
                  {room.occupants}/{room.capacity || "∞"} santri · {room.lockers.length} loker
                </p>
              </summary>

              <div class="border-t border-stone-100 px-4 py-3">
                {#if data.canManage}
                  <form method="POST" action="?/updateRoom" class="grid gap-3 sm:grid-cols-5 sm:items-end">
                    <input type="hidden" name="id" value={room.id} />
                    <label class="block sm:col-span-2">
                      <span class="mb-1 block text-xs font-medium text-stone-500">Nama kamar</span>
                      <input name="name" value={room.name} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-xs font-medium text-stone-500">Kapasitas</span>
                      <input name="capacity" type="number" min="0" value={room.capacity} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                    <label class="flex items-center gap-2 pb-2 text-sm text-stone-700">
                      <input type="checkbox" name="isActive" checked={room.isActive} class="rounded" />
                      Aktif
                    </label>
                    <button type="submit" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900">
                      <Save class="h-4 w-4" /> Simpan
                    </button>
                    <label class="block sm:col-span-5">
                      <span class="mb-1 block text-xs font-medium text-stone-500">Catatan</span>
                      <input name="notes" value={room.notes ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                  </form>
                {/if}

                <div class="mt-4">
                  <h4 class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    <KeyRound class="h-3.5 w-3.5" /> Loker
                  </h4>
                  <div class="mt-2 flex flex-wrap gap-2">
                    {#each room.lockers as locker (locker.id)}
                      <details class="rounded-lg border border-stone-200 px-2 py-1 text-xs">
                        <summary class="flex cursor-pointer list-none items-center gap-1.5">
                          <span class="font-mono font-semibold text-stone-800">{locker.code}</span>
                          <span class="{locker.occupied ? 'text-amber-600' : 'text-brand-700'}">
                            {locker.occupied ? "terpakai" : "kosong"}
                          </span>
                          {#if !locker.isActive}
                            <span class="text-red-600">nonaktif</span>
                          {/if}
                        </summary>
                        {#if data.canManage}
                          <form method="POST" action="?/updateLocker" class="mt-2 w-56 space-y-2">
                            <input type="hidden" name="id" value={locker.id} />
                            <input name="code" value={locker.code} required class="w-full rounded border border-stone-300 px-2 py-1 text-xs" />
                            <input name="notes" value={locker.notes ?? ""} placeholder="Catatan" class="w-full rounded border border-stone-300 px-2 py-1 text-xs" />
                            <label class="flex items-center gap-1.5 text-stone-600">
                              <input type="checkbox" name="isActive" checked={locker.isActive} class="rounded" />
                              Aktif
                            </label>
                            <div class="flex gap-2">
                              <button type="submit" class="rounded bg-stone-800 px-2 py-1 text-white">Simpan</button>
                              <button
                                type="submit"
                                formaction="?/deleteLocker"
                                class="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-red-600"
                                onclick={(event) => {
                                  if (!confirm("Hapus loker ini?")) event.preventDefault();
                                }}
                              >
                                <Trash2 class="h-3 w-3" /> Hapus
                              </button>
                            </div>
                          </form>
                        {/if}
                      </details>
                    {/each}
                    {#if room.lockers.length === 0}
                      <p class="text-xs text-stone-500">Belum ada loker.</p>
                    {/if}
                  </div>

                  {#if data.canManage}
                    <form method="POST" action="?/createLocker" class="mt-3 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="roomId" value={room.id} />
                      <label class="block">
                        <span class="mb-1 block text-xs font-medium text-stone-500">Nomor loker</span>
                        <input name="code" placeholder="01" required class="w-28 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                      </label>
                      <label class="block">
                        <span class="mb-1 block text-xs font-medium text-stone-500">Catatan</span>
                        <input name="notes" class="w-40 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
                      </label>
                      <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                        <Plus class="h-4 w-4" /> Loker
                      </button>
                    </form>
                  {/if}
                </div>
              </div>
            </details>
          {/each}

          {#if building.rooms.length === 0}
            <p class="rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
              Belum ada kamar di gedung ini.
            </p>
          {/if}
        </div>

        {#if data.canManage}
          <form method="POST" action="?/createRoom" class="mt-4 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
            <input type="hidden" name="buildingId" value={building.id} />
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-stone-500">Nama kamar</span>
              <input name="name" placeholder="Kamar 01" required class="w-40 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-stone-500">Kapasitas</span>
              <input name="capacity" type="number" min="0" value="0" class="w-28 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-stone-500">Catatan</span>
              <input name="notes" class="w-48 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>
            <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              <Plus class="h-4 w-4" /> Kamar
            </button>
          </form>
        {/if}
      </div>
    </details>
  {/each}

  {#if data.buildings.length === 0}
    <div class="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
      Belum ada gedung asrama. Tambahkan gedung pertama di atas.
    </div>
  {/if}
</div>
