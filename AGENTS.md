# AGENTS.md

## Scope

- This repo currently contains one real app: `telephysio-ai-mobile/`.
- Work from `telephysio-ai-mobile/` for app changes; the repo root is not a Node workspace and has no root `package.json`.

## App Entrypoints

- Main app entry is `telephysio-ai-mobile/App.tsx`.
- Navigation is defined inline in `App.tsx` using `@react-navigation/native-stack`.
- Current screens are:
  - `src/screens/Home/HomeScreen.tsx`
  - `src/screens/Calibration/CalibrationScreen.tsx`
  - `src/screens/Session/SessionScreen.tsx`
- Firebase setup lives in `telephysio-ai-mobile/src/services/firebase/config.ts`.

## Commands

- Install deps: `cd telephysio-ai-mobile && npm install`
- Start dev server: `cd telephysio-ai-mobile && npx expo start`
- Start with cleared cache after dependency/config changes: `cd telephysio-ai-mobile && npx expo start --clear`
- Platform shortcuts are the package scripts in `telephysio-ai-mobile/package.json`:
  - `npm run android`
  - `npm run ios`
  - `npm run web`

## Dependency Rules

- This app is on Expo SDK 55 (`expo@^55.0.15`) with React 19 / React Native 0.83.
- When adding or changing Expo-native packages, use `npx expo install <package>` from `telephysio-ai-mobile/` instead of `npm install` so versions stay SDK-compatible.
- `tsconfig.json` explicitly includes Node types so `process.env.EXPO_PUBLIC_*` resolves in TypeScript. Do not remove `"types": ["node"]` unless you replace the env access pattern.

## Env And Secrets

- Firebase config is read from `EXPO_PUBLIC_FIREBASE_*` variables in `src/services/firebase/config.ts`.
- Local secrets belong in `telephysio-ai-mobile/.env`.
- Keep `telephysio-ai-mobile/.env.example` updated when env keys change.
- `.env` is gitignored; do not hardcode Firebase values back into source files.

## Verification

- There is currently no repo-local lint, test, or CI workflow configured.
- The most relevant verification step available in this repo is starting Expo successfully from `telephysio-ai-mobile/`.
- After dependency upgrades, run `npx expo install --fix` and `npx expo-doctor` from `telephysio-ai-mobile/`.

## WSL2 / Expo Go Gotcha

- If working from WSL2 on Windows and Expo Go cannot reach the dev server, check `telephysio-ai-mobile/docs/SETUP_GUIDE.md`.
- The verified repo-specific fix is enabling WSL mirrored networking in `%USERPROFILE%/.wslconfig` and restarting WSL. If the Expo QR code shows a `172.x.x.x` address, mirrored mode is likely not applied.
