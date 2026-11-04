<script lang="ts">
  import { onMount } from "svelte";
  import { Loader2 } from "@lucide/svelte";
  import {
    OWNERSHIP_OPTIONS,
    TRANSPORTATION_OPTIONS,
    type AddressDraft
  } from "$lib/types/registration";

  let { address, idPrefix }: { address: AddressDraft; idPrefix: string } = $props();

  type Region = { id: string; name: string };

  const cache = new Map<string, Region[]>();

  async function loadRegions(path: string, params?: Record<string, string>): Promise<Region[]> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const key = `${path}${query}`;

    if (cache.has(key)) return cache.get(key) ?? [];

    try {
      const response = await fetch(`/api/wilayah/${path}${query}`);
      if (!response.ok) return [];
      const rows = (await response.json()) as Region[];
      cache.set(key, rows);
      return rows;
    } catch {
      return [];
    }
  }

  let provinces = $state<Region[]>([]);
  let regencies = $state<Region[]>([]);
  let districts = $state<Region[]>([]);
  let villages = $state<Region[]>([]);
  let loading = $state<"" | "province" | "regency" | "district" | "village">("");

  function findByName(list: Region[], name: string): string {
    const needle = name.trim().toLowerCase();
    if (!needle) return "";
    return list.find((item) => item.name.toLowerCase() === needle)?.id ?? "";
  }

  onMount(async () => {
    loading = "province";
    provinces = await loadRegions("provinces");
    loading = "";

    if (!address.provinceCode && address.province) {
      address.provinceCode = findByName(provinces, address.province);
    }
    if (!address.provinceCode) return;

    loading = "regency";
    regencies = await loadRegions("regencies", { province: address.provinceCode });
    loading = "";

    if (!address.regencyCode && address.regency) {
      address.regencyCode = findByName(regencies, address.regency);
    }
    if (!address.regencyCode) return;

    loading = "district";
    districts = await loadRegions("districts", { regency: address.regencyCode });
    loading = "";

    if (!address.districtCode && address.district) {
      address.districtCode = findByName(districts, address.district);
    }
    if (!address.districtCode) return;

    loading = "village";
    villages = await loadRegions("villages", { district: address.districtCode });
    loading = "";

    if (!address.villageCode && address.village) {
      address.villageCode = findByName(villages, address.village);
    }
  });

  async function changeProvince(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    address.provinceCode = id;
    address.province = provinces.find((item) => item.id === id)?.name ?? "";

    address.regencyCode = "";
    address.regency = "";
    address.districtCode = "";
    address.district = "";
    address.villageCode = "";
    address.village = "";

    regencies = [];
    districts = [];
    villages = [];

    if (!id) return;

    loading = "regency";
    regencies = await loadRegions("regencies", { province: id });
    loading = "";
  }

  async function changeRegency(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    address.regencyCode = id;
    address.regency = regencies.find((item) => item.id === id)?.name ?? "";

    address.districtCode = "";
    address.district = "";
    address.villageCode = "";
    address.village = "";

    districts = [];
    villages = [];

    if (!id) return;

    loading = "district";
    districts = await loadRegions("districts", { regency: id });
    loading = "";
  }

  async function changeDistrict(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    address.districtCode = id;
    address.district = districts.find((item) => item.id === id)?.name ?? "";

    address.villageCode = "";
    address.village = "";

    villages = [];

    if (!id) return;

    loading = "village";
    villages = await loadRegions("villages", { district: id });
    loading = "";
  }

  function changeVillage(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    address.villageCode = id;
    address.village = villages.find((item) => item.id === id)?.name ?? "";
  }

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";
</script>

<div class="grid gap-4 sm:grid-cols-2">
  <label class="block sm:col-span-2">
    <span class="mb-1 block text-sm font-medium text-stone-700">Status kepemilikan rumah <span class="font-normal text-stone-400">(opsional)</span></span>
    <select id="{idPrefix}-ownership" bind:value={address.ownershipStatus} class={inputClass}>
      <option value="">Pilih</option>
      {#each OWNERSHIP_OPTIONS as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Provinsi <span class="text-red-500">*</span></span>
    <select
      id="{idPrefix}-province"
      value={address.provinceCode}
      onchange={changeProvince}
      class={inputClass}
    >
      <option value="">{loading === "province" ? "Memuat provinsi…" : "Pilih provinsi"}</option>
      {#each provinces as province (province.id)}
        <option value={province.id}>{province.name}</option>
      {/each}
    </select>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Kabupaten / kota <span class="text-red-500">*</span></span>
    <select
      id="{idPrefix}-regency"
      value={address.regencyCode}
      onchange={changeRegency}
      disabled={!address.provinceCode || loading === "regency"}
      class={inputClass}
    >
      <option value="">
        {loading === "regency"
          ? "Memuat kabupaten/kota…"
          : address.provinceCode
            ? "Pilih kabupaten/kota"
            : "Pilih provinsi dulu"}
      </option>
      {#each regencies as regency (regency.id)}
        <option value={regency.id}>{regency.name}</option>
      {/each}
    </select>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Kecamatan <span class="text-red-500">*</span></span>
    <select
      id="{idPrefix}-district"
      value={address.districtCode}
      onchange={changeDistrict}
      disabled={!address.regencyCode || loading === "district"}
      class={inputClass}
    >
      <option value="">
        {loading === "district"
          ? "Memuat kecamatan…"
          : address.regencyCode
            ? "Pilih kecamatan"
            : "Pilih kabupaten/kota dulu"}
      </option>
      {#each districts as district (district.id)}
        <option value={district.id}>{district.name}</option>
      {/each}
    </select>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Kelurahan / desa <span class="text-red-500">*</span></span>
    <select
      id="{idPrefix}-village"
      value={address.villageCode}
      onchange={changeVillage}
      disabled={!address.districtCode || loading === "village"}
      class={inputClass}
    >
      <option value="">
        {loading === "village"
          ? "Memuat desa/kelurahan…"
          : address.districtCode
            ? "Pilih kelurahan/desa"
            : "Pilih kecamatan dulu"}
      </option>
      {#each villages as village (village.id)}
        <option value={village.id}>{village.name}</option>
      {/each}
    </select>
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">RT <span class="font-normal text-stone-400">(opsional)</span></span>
    <input id="{idPrefix}-rt" bind:value={address.rt} class={inputClass} />
  </label>
  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">RW <span class="font-normal text-stone-400">(opsional)</span></span>
    <input id="{idPrefix}-rw" bind:value={address.rw} class={inputClass} />
  </label>
  <label class="block sm:col-span-2">
    <span class="mb-1 block text-sm font-medium text-stone-700">Nama jalan, gang <span class="font-normal text-stone-400">(opsional)</span></span>
    <input id="{idPrefix}-street" bind:value={address.street} class={inputClass} />
  </label>
  <label class="block">
    <span class="mb-1 block text-sm font-medium text-stone-700">Kode pos <span class="font-normal text-stone-400">(opsional)</span></span>
    <input id="{idPrefix}-postal" bind:value={address.postalCode} maxlength="5" inputmode="numeric" class={inputClass} />
  </label>
</div>

{#if loading}
  <p class="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
    <Loader2 class="h-3.5 w-3.5 animate-spin" /> Memuat data wilayah…
  </p>
{/if}

<div class="mt-5 border-t border-stone-100 pt-5">
  <h3 class="text-sm font-semibold text-stone-800">Perjalanan ke pondok</h3>
  <div class="mt-3 grid gap-4 sm:grid-cols-3">
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Jarak tempat tinggal</span>
      <div class="flex items-center gap-2">
        <input bind:value={address.distanceKm} inputmode="decimal" class={inputClass} />
        <span class="text-sm text-stone-500">km</span>
      </div>
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Transportasi</span>
      <select bind:value={address.transportation} class={inputClass}>
        <option value="">Pilih</option>
        {#each TRANSPORTATION_OPTIONS as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-stone-700">Waktu tempuh</span>
      <div class="flex items-center gap-2">
        <input bind:value={address.travelMinutes} inputmode="numeric" class={inputClass} />
        <span class="text-sm text-stone-500">menit</span>
      </div>
    </label>
  </div>
</div>
