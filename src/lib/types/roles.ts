export type Role = "super_admin" | "staff_pendaftaran" | "staff_keuangan";

export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  staff_pendaftaran: "Staff Pendaftaran",
  staff_keuangan: "Staff Keuangan"
};

export const allRoles: Role[] = ["super_admin", "staff_pendaftaran", "staff_keuangan"];

export function roleHome(role: Role): string {
  return role === "staff_keuangan" ? "/admin/keuangan" : "/admin";
}
