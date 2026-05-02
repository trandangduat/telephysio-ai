#!/usr/bin/env node
/**
 * patch-zustand.js
 * Postinstall script: Replace import.meta.env in Zustand ESM files
 * with a process.env-compatible equivalent for Metro/Expo web.
 *
 * Run automatically after `npm install` via postinstall hook.
 */

const fs = require('fs');
const path = require('path');

const ZUSTAND_ESM_DIR = path.join(__dirname, '..', 'node_modules', 'zustand', 'esm');

const FILES_TO_PATCH = [
  'index.mjs',
  'vanilla.mjs',
  'middleware.mjs',
  'context.mjs',
  'index.js',
  'vanilla.js',
  'middleware.js',
  'context.js',
];

const PATTERN = /\(import\.meta\.env \? import\.meta\.env\.MODE : void 0\)/g;
const REPLACEMENT = '((typeof process !== "undefined" && process.env.NODE_ENV) || "development")';

let patchedCount = 0;

for (const file of FILES_TO_PATCH) {
  const filePath = path.join(ZUSTAND_ESM_DIR, file);
  if (!fs.existsSync(filePath)) continue;

  const original = fs.readFileSync(filePath, 'utf8');
  if (!original.includes('import.meta')) continue;

  const patched = original.replace(PATTERN, REPLACEMENT);
  fs.writeFileSync(filePath, patched, 'utf8');
  patchedCount++;
  console.log(`[patch-zustand] Patched: ${file}`);
}

if (patchedCount === 0) {
  console.log('[patch-zustand] No files needed patching (already clean).');
} else {
  console.log(`[patch-zustand] Done: ${patchedCount} file(s) patched.`);
}
