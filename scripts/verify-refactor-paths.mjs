#!/usr/bin/env node
/**
 * Validates refactor paths before push (git casing + imports).
 * Uses tracked and untracked files on disk so local runs match post-commit CI.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

function gitLines(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

const tracked = gitLines('git ls-files "src/**" "scripts/**"');
const untracked = gitLines('git ls-files --others --exclude-standard "src/**" "scripts/**"');
const allRepoPaths = new Set([...tracked, ...untracked]);

const legacyGitPrefixes = [
  'src/features/attendance/components/board/',
  'src/features/attendance/components/cards/',
  'src/features/attendance/components/modals/',
  'src/features/attendance/components/consultation/',
  'src/features/attendance/components/scheduling/',
  'src/features/attendance/components/walkIn/',
  'src/features/attendance/components/endOfDay/',
  'src/features/attendance/components/treatmentSession/',
  'src/features/attendance/components/treatmentRecommendations/',
  'src/features/attendance/components/attendanceActions/',
  'src/features/attendance/AttendanceManagement.tsx',
  'src/features/attendance/hooks/useAttendanceManagement.ts',
  'src/api/dayFinalization/',
  'src/api/query/hooks/usePatientComplaint.ts',
  'src/features/settings/ProfileSettings.tsx',
  'src/features/settings/UserManagement.tsx',
  'src/features/settings/SystemSettings.tsx',
  'src/features/settings/hooks/',
];

const attendanceLegacyFolders = {
  attendanceActions: 'AttendanceActions',
  board: 'Board',
  cards: 'Cards',
  consultation: 'Consultation',
  endOfDay: 'EndOfDay',
  modals: 'Modals',
  scheduling: 'Scheduling',
  treatmentRecommendations: 'TreatmentRecommendations',
  treatmentSession: 'TreatmentSession',
  walkIn: 'WalkIn',
};

const legacyImportSubstrings = [
  'features/attendance/components/board/',
  'features/attendance/components/cards/',
  'features/attendance/components/modals/',
  'features/attendance/components/consultation/',
  'features/attendance/components/scheduling/',
  'features/attendance/components/walkIn/',
  'features/attendance/components/endOfDay/',
  'features/attendance/components/treatmentSession/',
  'features/attendance/components/treatmentRecommendations/',
  'features/attendance/components/attendanceActions/',
  'features/attendance/AttendanceManagement',
  'hooks/useAttendanceManagement',
  'api/dayFinalization',
  'query/hooks/usePatientComplaint',
  'features/settings/ProfileSettings',
  'features/settings/UserManagement',
  'features/settings/SystemSettings',
  'features/settings/hooks/',
  'api/reactQuery',
  'src/api/hooks/',
];

const requiredUntrackedPrefixes = ['src/api/query/keys/'];

const importRe =
  /(?:from|import(?:\s+type)?)\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      walk(full, files);
    } else if (/\.(ts|tsx|mjs|js)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

function resolveImport(importer, spec) {
  if (spec.startsWith('@/')) {
    return normalize(join(ROOT, 'src', spec.slice(2)));
  }
  if (spec.startsWith('.')) {
    return normalize(join(dirname(importer), spec));
  }
  return null;
}

function existsInRepo(resolved) {
  const candidates = [];
  if (/\.(ts|tsx|js|mjs)$/.test(resolved)) {
    candidates.push(relative(ROOT, resolved));
  } else {
    candidates.push(
      relative(ROOT, `${resolved}.ts`),
      relative(ROOT, `${resolved}.tsx`),
      relative(ROOT, join(resolved, 'index.ts')),
      relative(ROOT, join(resolved, 'index.tsx')),
    );
  }
  return candidates.some((c) => {
    const p = c.replace(/\\/g, '/');
    return !p.startsWith('..') && (allRepoPaths.has(p) || existsSync(join(ROOT, p)));
  });
}

const errors = [];

for (const p of tracked) {
  for (const prefix of legacyGitPrefixes) {
    if (p.startsWith(prefix) || p === prefix.replace(/\/$/, '')) {
      if (existsSync(join(ROOT, p))) {
        errors.push(`legacy path still on disk (and in git index): ${p}`);
      }
    }
  }
}

const byLower = new Map();
for (const p of [...allRepoPaths]) {
  const k = p.toLowerCase();
  if (!byLower.has(k)) byLower.set(k, []);
  byLower.get(k).push(p);
}
for (const [, paths] of byLower) {
  if (paths.length > 1) {
    errors.push(`case collision (tracked + untracked): ${paths.join(' vs ')}`);
  }
}

for (const prefix of requiredUntrackedPrefixes) {
  const onDisk = untracked.filter((p) => p.startsWith(prefix));
  const trackedKeys = tracked.filter((p) => p.startsWith(prefix));
  if (onDisk.length > 0) {
    errors.push(
      `not committed yet: ${onDisk.length} file(s) under ${prefix} — run: git add ${prefix}`,
    );
  } else if (trackedKeys.length === 0) {
    errors.push(`missing required directory: ${prefix}`);
  }
}

for (const file of walk(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8');
  let m;
  importRe.lastIndex = 0;
  while ((m = importRe.exec(text)) !== null) {
    const spec = (m[1] ?? m[2]).split('?')[0];
    if (!spec || spec.startsWith('node:') || (!spec.startsWith('.') && !spec.startsWith('@/'))) {
      continue;
    }

    for (const bad of legacyImportSubstrings) {
      if (spec.includes(bad)) {
        errors.push(`${relative(ROOT, file)}: legacy import "${spec}"`);
      }
    }

    const absFolderMatch = spec.match(/features\/attendance\/components\/([^/'"]+)/);
    if (absFolderMatch && absFolderMatch[1] in attendanceLegacyFolders) {
      errors.push(
        `${relative(ROOT, file)}: use ${attendanceLegacyFolders[absFolderMatch[1]]} in ${spec}`,
      );
    }

    const relComponents = spec.match(/components\/([^/'"]+)/);
    if (relComponents && relComponents[1] in attendanceLegacyFolders) {
      errors.push(
        `${relative(ROOT, file)}: legacy folder "${relComponents[1]}" in ${spec}`,
      );
    }

    const resolved = resolveImport(file, spec);
    if (resolved && resolved.includes(join(ROOT, 'src'))) {
      if (!existsInRepo(resolved) && !/\.(css|json|svg|png|woff2?)$/.test(spec)) {
        errors.push(`${relative(ROOT, file)}: cannot resolve "${spec}"`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Refactor path verification failed (${errors.length} issue(s)):\n`);
  for (const e of [...new Set(errors)].slice(0, 100)) console.error(`  ✗ ${e}`);
  if (errors.length > 100) console.error(`  ... and ${errors.length - 100} more`);
  process.exit(1);
}

console.log('Refactor path verification OK.');
console.log(`  • ${tracked.length} tracked + ${untracked.length} untracked paths under src/ & scripts/`);
console.log('  • No legacy folder names in git or imports');
console.log('  • No case collisions');
console.log('  • Required paths (e.g. api/query/keys/) included');
