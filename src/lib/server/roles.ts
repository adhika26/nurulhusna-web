import type { Role } from "$lib/types/roles";

/** Area menu yang boleh dibuka. Action tetap dibatasi per fungsi di bawah. */
const areaAccess: Record<string, Role[]> = {
  pendaftaran: ["super_admin", "staff_pendaftaran"],
  pembayaran: ["super_admin", "staff_keuangan"],
  keuangan: ["super_admin", "staff_keuangan"],
  santri: ["super_admin", "staff_pendaftaran"],
  asrama: ["super_admin", "staff_pendaftaran"],
  master: ["super_admin"],
  konten: ["super_admin"],
  pengaturan: ["super_admin"],
  pengguna: ["super_admin"]
};

export function canOpenArea(role: Role, area: string): boolean {
  return areaAccess[area]?.includes(role) ?? false;
}

export function canManageRegistration(role: Role | undefined): boolean {
  return role === "super_admin" || role === "staff_pendaftaran";
}

export function canManagePayment(role: Role | undefined): boolean {
  return role === "super_admin" || role === "staff_keuangan";
}

export function canManageSantri(role: Role | undefined): boolean {
  return role === "super_admin" || role === "staff_pendaftaran";
}

export function canManageAsrama(role: Role | undefined): boolean {
  return role === "super_admin" || role === "staff_pendaftaran";
}

export function canManageUsers(role: Role | undefined): boolean {
  return role === "super_admin";
}
