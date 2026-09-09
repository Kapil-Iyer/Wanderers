/**
 * Reachability analysis over the real import graph.
 *
 * Next.js entry points (page/layout/route/middleware, plus config at the root)
 * are roots; anything not reachable from a root is dead. Resolves the "@/"
 * alias and extensionless/index imports the same way the bundler does.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const files = globSync("src/**/*.{ts,tsx,js,jsx,mjs}", { cwd: ROOT }).map((f) =>
  path.join(ROOT, f)
);

const EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"];

function resolve(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // bare package import

  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const e of EXTS) if (existsSync(base + e)) return base + e;
  for (const e of EXTS) {
    const idx = path.join(base, "index" + e);
    if (existsSync(idx)) return idx;
  }
  return null;
}

const IMPORT_RE =
  /(?:import|export)\s+(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\)/g;

const graph = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const deps = new Set();
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3];
    if (!spec) continue;
    const r = resolve(spec, f);
    if (r) deps.add(r);
  }
  graph.set(f, deps);
}

const isEntry = (f) => {
  const rel = path.relative(ROOT, f);
  const b = path.basename(f);
  if (/^src\/app\//.test(rel) && /^(page|layout|route|template|error|loading|not-found|global-error|default)\.(ts|tsx)$/.test(b))
    return true;
  if (/^src\/(middleware|instrumentation)\.ts$/.test(rel)) return true;
  return false;
};

const roots = files.filter(isEntry);
const seen = new Set();
const stack = [...roots];
while (stack.length) {
  const f = stack.pop();
  if (seen.has(f)) continue;
  seen.add(f);
  for (const d of graph.get(f) ?? []) if (!seen.has(d)) stack.push(d);
}

const dead = files.filter((f) => !seen.has(f)).sort();

console.log(`entry points: ${roots.length}`);
console.log(`reachable:    ${seen.size}`);
console.log(`UNREACHABLE:  ${dead.length}\n`);
for (const f of dead) console.log("  " + path.relative(ROOT, f));

// Which reachable files import each dead file? (sanity: should be none)
console.log("\n--- inbound edges into unreachable files (should be empty) ---");
for (const f of dead) {
  const importers = files.filter((o) => (graph.get(o) ?? new Set()).has(f) && seen.has(o));
  if (importers.length)
    console.log(`  ${path.relative(ROOT, f)} <- ${importers.map((i) => path.relative(ROOT, i)).join(", ")}`);
}
