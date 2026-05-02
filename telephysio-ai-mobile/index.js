// index.js — App entry point shim
// Must be the FIRST file to run before any ESM imports.
// This polyfills `import.meta` for Metro/Expo web where it is not supported.

// Polyfill import.meta for packages like Zustand that use import.meta.env
if (typeof globalThis.importMeta === 'undefined') {
  globalThis.importMeta = {
    env: {
      MODE: __DEV__ ? 'development' : 'production',
      DEV: __DEV__,
      PROD: !__DEV__,
    },
  };
}

// Re-export the real Expo entry
import 'expo/AppEntry';
