import { fail } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { canManageUsers } from "$lib/server/roles";
import { logAudit } from "$lib/server/services/audit.service";
import type { Role } from "$lib/types/roles";
import type { Actions, PageServerLoad } from "./$types";

const roles: Role[] = ["super_admin", "staff_pendaftaran", "staff_keuangan"];

export const load: PageServerLoad = async ({ locals }) => {
  const users = await db
    .select({
      id: table.user.id,
      username: table.user.username,
      email: table.user.email,
      fullName: table.user.fullName,
      role: table.user.role,
      isActive: table.user.isActive,
      lastLoginAt: table.user.lastLoginAt,
      createdAt: table.user.createdAt
    })
    .from(table.user)
    .orderBy(asc(table.user.id));

  return { users, canManage: canManageUsers(locals.user?.role) };
};

async function passwordHash(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  });
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!canManageUsers(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak menambah pengguna." });
    }

    const formData = await request.formData();
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "staff_pendaftaran") as Role;

    if (!username || !fullName || !password) {
      return fail(400, { message: "Username, nama, dan password wajib diisi." });
    }

    if (password.length < 8) {
      return fail(400, { message: "Password minimal 8 karakter." });
    }

    if (!roles.includes(role)) {
      return fail(400, { message: "Role tidak valid." });
    }

    try {
      await db.insert(table.user).values({
        username,
        email: email || null,
        fullName,
        passwordHash: await passwordHash(password),
        role
      });
    } catch {
      return fail(400, { message: "Username atau email sudah dipakai." });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "user.create",
      entityType: "user",
      entityId: username
    });

    return { success: true, message: `Akun "${username}" dibuat.` };
  },

  update: async ({ request, locals }) => {
    if (!canManageUsers(locals.user?.role)) {
      return fail(403, { message: "Anda tidak berhak mengubah pengguna." });
    }

    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const role = String(formData.get("role") ?? "") as Role;
    const isActive = formData.get("isActive") === "on";
    const password = String(formData.get("password") ?? "");

    if (!id || !fullName || !roles.includes(role)) {
      return fail(400, { message: "Data pengguna tidak lengkap." });
    }

    if (id === locals.user?.id && (role !== "super_admin" || !isActive)) {
      return fail(400, { message: "Tidak dapat menurunkan atau menonaktifkan akun sendiri." });
    }

    if (password && password.length < 8) {
      return fail(400, { message: "Password baru minimal 8 karakter." });
    }

    const patch: Partial<typeof table.user.$inferInsert> = {
      fullName,
      email: email || null,
      role,
      isActive,
      updatedAt: new Date()
    };

    if (password) patch.passwordHash = await passwordHash(password);

    try {
      await db.update(table.user).set(patch).where(eq(table.user.id, id));
    } catch {
      return fail(400, { message: "Email sudah dipakai pengguna lain." });
    }

    await logAudit({
      userId: locals.user?.id,
      action: "user.update",
      entityType: "user",
      entityId: String(id)
    });

    return { success: true, message: "Data pengguna diperbarui." };
  }
};
