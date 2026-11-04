import * as fs from "fs";
import * as path from "path";

/**
 * Memuat variabel environment dari file .env ke process.env.
 * Tidak membutuhkan dependency tambahan.
 */
export function loadEnv(envFilePath = ".env"): Record<string, string> {
  const absPath = path.resolve(process.cwd(), envFilePath);

  if (!fs.existsSync(absPath)) {
    console.warn(`[loadEnv] File .env tidak ditemukan di ${absPath}`);
    return {};
  }

  const content = fs.readFileSync(absPath, "utf8");
  const lines = content.split(/\r?\n/);
  const result: Record<string, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;

    let [, key, value] = match;
    if (!value) value = "";

    if (!/^['"]/.test(value)) {
      const hashIndex = value.indexOf("#");
      if (hashIndex !== -1) value = value.slice(0, hashIndex).trim();
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");

    result[key] = value;
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return result;
}
