#!/usr/bin/env node
// Enforces the module boundary: FRONT and ADMIN must never import each other.
//
//   front  = app/(front)/**  + modules/front/**
//   admin  = app/(admin)/**  + modules/admin/**
//   shared = shared/**        (usable by both; may import neither)
//
// Runs automatically before `npm run build` (prebuild) — a violation fails the build.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ZONES = {
  front: ['app/(front)', 'modules/front'],
  admin: ['app/(admin)', 'modules/admin'],
  shared: ['shared'],
};
// which zones each zone may import from (besides itself and npm packages)
const ALLOWED = { front: ['shared'], admin: ['shared'], shared: [] };

const ALIASES = { '@front/': 'modules/front/', '@admin/': 'modules/admin/', '@shared/': 'shared/' };

const SOURCE = /\.(tsx?|jsx?|mjs|cjs|css|scss)$/;
const IMPORT_RE =
  /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)|@import\s+(?:url\()?['"]([^'"]+)['"]/g;

const toPosix = (p) => p.split(sep).join('/');

function zoneOf(relPath) {
  for (const [zone, dirs] of Object.entries(ZONES)) {
    if (dirs.some((d) => relPath === d || relPath.startsWith(d + '/'))) return zone;
  }
  return null;
}

// Resolve an import specifier to a repo-relative path, or null for npm packages.
function target(spec, fromFile) {
  for (const [alias, dir] of Object.entries(ALIASES)) {
    if (spec.startsWith(alias)) return dir + spec.slice(alias.length);
  }
  if (spec.startsWith('.')) return toPosix(relative(ROOT, resolve(dirname(fromFile), spec)));
  return null;
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // zone directory doesn't exist yet (e.g. shared/)
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SOURCE.test(name)) yield full;
  }
}

const violations = [];
let files = 0;
for (const [zone, dirs] of Object.entries(ZONES)) {
  for (const dir of dirs) {
    for (const file of walk(join(ROOT, dir))) {
      files++;
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(IMPORT_RE)) {
        const spec = m.slice(1).find(Boolean);
        const to = target(spec, file);
        const toZone = to && zoneOf(to);
        if (toZone && toZone !== zone && !ALLOWED[zone].includes(toZone)) {
          const line = text.slice(0, m.index).split('\n').length;
          violations.push(`${toPosix(relative(ROOT, file))}:${line}  ${zone} → ${toZone}  ('${spec}')`);
        }
      }
    }
  }
}

if (violations.length) {
  console.error('Module boundary violations (front and admin must not import each other):');
  for (const v of violations) console.error('  ' + v);
  console.error('Move code both need into shared/ (import it as @shared/...).');
  process.exit(1);
}
console.log(`Module boundaries OK (${files} files checked: front ⟂ admin).`);
