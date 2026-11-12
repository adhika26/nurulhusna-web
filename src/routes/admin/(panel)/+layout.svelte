<script lang="ts">
  import { page } from "$app/state";
  import {
    LayoutDashboard,
    BarChart3,
    ClipboardList,
    Wallet,
    GraduationCap,
    Building2,
    SlidersHorizontal,
    Newspaper,
    Settings,
    Users,
    LogOut
  } from "@lucide/svelte";
  import { roleHome, roleLabels, type Role } from "$lib/types/roles";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: import("svelte").Snippet } = $props();

  const menu = $derived(
    [
      {
        href: roleHome(data.user.role),
        label:
          data.user.role === "staff_keuangan"
            ? "Ringkasan Pembayaran"
            : data.user.role === "staff_pendaftaran"
              ? "Ringkasan Pendaftaran"
              : "Ringkasan",
        icon: LayoutDashboard,
        exact: true,
        roles: null
      },
      {
        href: "/admin/keuangan",
        label: "Ringkasan Keuangan",
        icon: BarChart3,
        roles: ["super_admin"] as Role[]
      },
      {
        href: "/admin/pendaftaran",
        label: "Pendaftaran",
        icon: ClipboardList,
        roles: ["super_admin", "staff_pendaftaran"] as Role[]
      },
      {
        href: "/admin/pembayaran",
        label: "Pembayaran",
        icon: Wallet,
        roles: ["super_admin", "staff_keuangan"] as Role[]
      },
      {
        href: "/admin/santri",
        label: "Data Santri",
        icon: GraduationCap,
        roles: ["super_admin", "staff_pendaftaran"] as Role[]
      },
      {
        href: "/admin/asrama",
        label: "Asrama",
        icon: Building2,
        roles: ["super_admin", "staff_pendaftaran"] as Role[]
      },
      {
        href: "/admin/master",
        label: "Data Master",
        icon: SlidersHorizontal,
        roles: ["super_admin"] as Role[]
      },
      {
        href: "/admin/konten",
        label: "Konten",
        icon: Newspaper,
        roles: ["super_admin"] as Role[]
      },
      {
        href: "/admin/pengaturan",
        label: "Pengaturan",
        icon: Settings,
        roles: ["super_admin"] as Role[]
      },
      {
        href: "/admin/pengguna",
        label: "Pengguna",
        icon: Users,
        roles: ["super_admin"] as Role[]
      }
    ].filter((item) => !item.roles || item.roles.includes(data.user.role))
  );

  function isActive(href: string, exact?: boolean) {
    return exact ? page.url.pathname === href : page.url.pathname.startsWith(href);
  }
</script>

<div class="min-h-screen bg-stone-100 lg:flex">
  <aside class="border-b border-stone-200 bg-white lg:min-h-screen lg:w-64 lg:border-r lg:border-b-0">
    <div class="flex items-center gap-3 px-5 py-5">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white">
        NH
      </div>
      <div class="leading-tight">
        <p class="text-sm font-semibold text-stone-900">Nurul Husna</p>
        <p class="text-xs text-stone-500">Panel Administrasi</p>
      </div>
    </div>

    <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
      {#each menu as item (item.href)}
        <a
          href={item.href}
          class="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition {isActive(
            item.href,
            item.exact
          )
            ? 'bg-brand-50 text-brand-800'
            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}"
        >
          <item.icon class="h-4 w-4" />
          {item.label}
        </a>
      {/each}
    </nav>
  </aside>

  <div class="flex-1">
    <header class="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
      <p class="text-sm text-stone-500">
        Selamat datang, <span class="font-medium text-stone-800">{data.user.fullName}</span>
        <span class="ml-2 rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          {roleLabels[data.user.role]}
        </span>
      </p>
      <form method="POST" action="/admin/logout">
        <button
          type="submit"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
        >
          <LogOut class="h-4 w-4" /> Keluar
        </button>
      </form>
    </header>

    <main class="p-4 lg:p-8">
      {@render children()}
    </main>
  </div>
</div>
