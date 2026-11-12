<script lang="ts">
  import { Plus, Save, ShieldCheck, UserRound } from "@lucide/svelte";
  import { roleLabels, type Role } from "$lib/types/roles";
  import { formatDateTime } from "$lib/utils/format";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const roles: Role[] = ["super_admin", "staff_pendaftaran", "staff_keuangan"];
</script>

<svelte:head><title>Pengguna | Admin Nurul Husna</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-semibold text-stone-900">Pengguna</h1>
    <p class="mt-1 text-sm text-stone-500">Kelola akun pengurus dan role akses panel admin.</p>
  </div>
</div>

{#if form?.message}
  <p class="mt-4 rounded-lg px-3 py-2 text-sm {form.success ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}">
    {form.message}
  </p>
{/if}

<section class="mt-6 rounded-xl bg-white p-5 ring-1 ring-stone-200">
  <h2 class="flex items-center gap-2 font-semibold text-stone-900">
    <Plus class="h-4 w-4 text-brand-700" /> Tambah pengguna
  </h2>
  <form method="POST" action="?/create" class="mt-3 grid gap-3 sm:grid-cols-6 sm:items-end">
    <label class="block sm:col-span-2">
      <span class="mb-1 block text-xs font-medium text-stone-500">Username</span>
      <input name="username" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block sm:col-span-2">
      <span class="mb-1 block text-xs font-medium text-stone-500">Nama lengkap</span>
      <input name="fullName" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block sm:col-span-2">
      <span class="mb-1 block text-xs font-medium text-stone-500">Email (opsional)</span>
      <input name="email" type="email" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block sm:col-span-2">
      <span class="mb-1 block text-xs font-medium text-stone-500">Password</span>
      <input name="password" type="password" minlength="8" required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
    </label>
    <label class="block sm:col-span-2">
      <span class="mb-1 block text-xs font-medium text-stone-500">Role</span>
      <select name="role" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="staff_pendaftaran">Staff Pendaftaran</option>
        <option value="staff_keuangan">Staff Keuangan</option>
        <option value="super_admin">Super Admin</option>
      </select>
    </label>
    <button type="submit" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:col-span-2">
      <Plus class="h-4 w-4" /> Tambah
    </button>
  </form>
</section>

<div class="mt-5 space-y-3">
  {#each data.users as user (user.id)}
    <details class="group rounded-xl bg-white ring-1 ring-stone-200">
      <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600">
            <UserRound class="h-4 w-4" />
          </div>
          <div>
            <p class="font-semibold text-stone-900">{user.fullName}</p>
            <p class="font-mono text-xs text-stone-500">{user.username}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            <ShieldCheck class="h-3 w-3" /> {roleLabels[user.role]}
          </span>
          {#if !user.isActive}
            <span class="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">nonaktif</span>
          {/if}
        </div>
      </summary>

      <form method="POST" action="?/update" class="grid gap-3 border-t border-stone-100 px-5 py-4 sm:grid-cols-6 sm:items-end">
        <input type="hidden" name="id" value={user.id} />
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs font-medium text-stone-500">Nama lengkap</span>
          <input name="fullName" value={user.fullName} required class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs font-medium text-stone-500">Email</span>
          <input name="email" type="email" value={user.email ?? ""} class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs font-medium text-stone-500">Role</span>
          <select name="role" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
            {#each roles as role (role)}
              <option value={role} selected={user.role === role}>{roleLabels[role]}</option>
            {/each}
          </select>
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs font-medium text-stone-500">Password baru (opsional)</span>
          <input name="password" type="password" minlength="8" class="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label class="flex items-center gap-2 pb-2 text-sm text-stone-700">
          <input type="checkbox" name="isActive" checked={user.isActive} class="rounded" />
          Aktif
        </label>
        <button type="submit" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-900 sm:col-span-2">
          <Save class="h-4 w-4" /> Simpan
        </button>
        <p class="text-xs text-stone-400 sm:col-span-6">
          Terakhir masuk: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-"} · Dibuat {formatDateTime(user.createdAt)}
        </p>
      </form>
    </details>
  {/each}
</div>
