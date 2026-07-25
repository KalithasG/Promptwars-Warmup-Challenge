/**
 * Zero-dependency .env loading + TLS escape hatch.
 *
 * Searches upward from this file for a .env (the project root may be several
 * levels up, e.g. repo root above model_routing_ts/), loads KEY=VALUE lines
 * into process.env without overwriting existing vars, and — if
 * GEMINI_INSECURE_TLS is truthy — disables Node's TLS verification. That's the
 * Node equivalent of the Python router's `verify=False`, for machines whose
 * HTTPS is intercepted by a proxy/antivirus ('CERTIFICATE_VERIFY_FAILED').
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function findDotenv(): string | null {
  let d = __dirname;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = join(d, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(d);
    if (parent === d) return null; // hit filesystem root
    d = parent;
  }
}

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  const path = findDotenv();
  if (path) {
    for (const raw of readFileSync(path, "utf-8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const idx = line.indexOf("=");
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }

  const insecure = (process.env.GEMINI_INSECURE_TLS ?? "").toLowerCase();
  if (["1", "true", "yes"].includes(insecure)) {
    // Must be set before TLS connections are made.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}

export function loadApiKey(): string {
  loadEnv();
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set (env or .env file).");
  return key;
}
