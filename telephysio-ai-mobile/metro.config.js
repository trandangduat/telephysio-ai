// metro.config.js
// Fix: Force Metro to use CJS builds of packages like Zustand
// that ship both ESM (with import.meta) and CJS versions.
// By NOT including 'import' in conditionNames, Metro uses the 'default' (CJS) entry.
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Do NOT include 'import' — this forces packages to use their CJS 'default' export
// which avoids 'import.meta' syntax that Metro can't handle
config.resolver.unstable_conditionNames = [
  'require',
  'default',
];

// Support .cjs and .mjs extensions (needed by some packages)
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

module.exports = config;
