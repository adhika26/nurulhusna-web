/**
 * Membuat akun admin pertama.
 * Contoh: npm run create:admin -- --username admin --password "rahasia123" --name "Administrator"
 */
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { db, client } from "../src/lib/server/db";
import * as table from "../src/lib/server/db/schema";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const username = readArg("--username")?.trim().toLowerCase();
  const password = readArg("--password");
  const name = readArg("--name") ?? "Administrator";
  const role = (readArg("--role") ?? "admin") as "admin" | "staff";

  if (!username || !password) {
    console.error(
      'Penggunaan: npm run create:admin -- --username admin --password "rahasia123" --name "Nama Lengkap"'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password minimal 8 karakter.");
    process.exit(1);
  }

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  });

  const [existing] = await db.select().from(table.user).where(eq(table.user.username, username));

  if (existing) {
    await db
      .update(table.user)
      .set({ passwordHash, fullName: name, role, isActive: true, updatedAt: new Date() })
      .where(eq(table.user.id, existing.id));
    console.log(`Akun "${username}" diperbarui.`);
  } else {
    await db.insert(table.user).values({
      username,
      passwordHash,
      fullName: name,
      role
    });
    console.log(`Akun "${username}" dibuat dengan role ${role}.`);
  }

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
