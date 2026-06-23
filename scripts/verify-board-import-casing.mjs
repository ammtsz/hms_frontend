#!/usr/bin/env node
/**
 * Fails CI if board component imports use folder casing that does not match git.
 * Linux (production) is case-sensitive; macOS often is not.
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const COMPONENTS = 'src/features/board/components';

const LEGACY_TO_PASCAL = {
  appointmentActions: 'AppointmentActions',
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

const gitPaths = new Set(
  execSync(`git ls-files '${COMPONENTS}/**'`, { cwd: ROOT, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean),
);

const patterns = [
  /(?:from|import)\s+['"]([^'"]*features\/board\/components\/([^/'"]+))/g,
  /(?:from|import)\s+['"](\.\.?\/)+components\/([^/'"]+)/g,
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

const errors = [];

function checkFolder(file, importPath, folder) {
  if (folder in LEGACY_TO_PASCAL) {
    errors.push(
      `${relative(ROOT, file)}: "${importPath}" uses legacy folder "${folder}" — use "${LEGACY_TO_PASCAL[folder]}".`,
    );
  }
}

for (const file of walk(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const importPath = match[1].startsWith('.') ? match[0] : match[1];
      const folder = match[2];
      checkFolder(file, importPath, folder);
    }
  }
}

for (const folder of Object.keys(LEGACY_TO_PASCAL)) {
  const wrong = `${COMPONENTS}/${folder}`;
  const hasWrongInGit = [...gitPaths].some((p) => p.startsWith(`${wrong}/`) || p === wrong);
  if (hasWrongInGit) {
    errors.push(`git still tracks lowercase path: ${wrong}/ (run two-step git mv).`);
  }
}

if (errors.length > 0) {
  console.error('Board import casing check failed:\n');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('Board component import casing OK (matches git PascalCase folders).');
