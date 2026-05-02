/**
 * i18n configuration — TelePhysioAI
 *
 * Uses i18next + react-i18next + expo-localization.
 * Default language: English ('en').
 * Supported languages: English ('en'), Vietnamese ('vi').
 *
 * Import this file once at app root (App.tsx) so the i18n instance
 * is initialised before any component renders.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en';
import vi from './locales/vi';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

/**
 * Detect device locale and resolve to a supported language.
 * Falls back to 'en' if the device language is not supported.
 */
function getDeviceLanguage(): string {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const lang = locales[0].languageCode;
      if (lang && lang in resources) {
        return lang;
      }
    }
  } catch {
    // expo-localization may throw on web during SSR
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default to English as requested
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  compatibilityJSON: 'v4',
});

export default i18n;

/**
 * Utility: get device language (useful for switching to device locale).
 */
export { getDeviceLanguage };
