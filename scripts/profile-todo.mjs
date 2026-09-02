#!/usr/bin/env node
/**
 * Lists every field in data/profile.json still holding a TODO placeholder.
 *
 *     npm run profile:todo
 *
 * Exits non-zero when anything is unfilled, so it can gate a deploy if you
 * ever want it to.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const profile = JSON.parse(readFileSync(join(root, "data/profile.json"), "utf8"));

const todos = [];
const walk = (value, path) => {
  if (typeof value === "string" && /^\s*todo:/i.test(value)) {
    todos.push({ path, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (path === "" && k === "meta") continue;
      walk(v, path ? `${path}.${k}` : k);
    }
  }
};
walk(profile, "");

if (todos.length === 0) {
  console.log("✅ profile.json is fully filled in.");
  process.exit(0);
}

console.log(`${todos.length} field(s) still to fill in data/profile.json:\n`);
for (const { path, value } of todos) {
  console.log(`  ${path}`);
  console.log(`    ${value.slice(0, 96)}${value.length > 96 ? "…" : ""}`);
}
console.log("\nThese show as dashed placeholders on the site, and are stripped");
console.log("from /api/profile and the AI assistant so nothing fake is served.");
process.exit(1);
