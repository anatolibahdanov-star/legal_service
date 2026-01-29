// 'use client'; 
// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';
// // Optional: import backend to load translations from files
// import Backend from 'i18next-http-backend'; 

// i18n
//   // Load translations from a backend (optional)
//   .use(Backend) 
//   // Detect user language
//   .use(LanguageDetector) 
//   // Pass the i18n instance to react-i18next
//   .use(initReactI18next) 
//   // Initialize i18next
//   .init({
//     fallbackLng: 'ru', // Default language if detection fails
//     debug: true,
//     interpolation: {
//       escapeValue: false, // React already escapes values
//     },
//     // Configuration for the language detector
//     detection: {
//       order: ['querystring', 'cookie', 'localStorage', 'navigator'], // Order of detection sources
//       lookupQuerystring: "lang",
//       caches: ['cookie'], // Cache the detected language
//     },
//     backend: {
//       // for all available options read the backend's repository readme file
//       loadPath: '/i18n/locales/{{lng}}/{{ns}}.json'
//     },
//     supportedLngs: ['en', 'fr', 'es', 'ru'], // List of supported languages
//   });

// export default i18n;

export const locales = ["en", "ru", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const rtlLocales = ["ar", "he", "fa", "ur"] as const;
export const isRtl = (locale: string) =>
  (rtlLocales as readonly string[]).includes(locale);

export function localizedPath(locale: string, path: string) {
  return locale === defaultLocale ? path : "/" + locale + path;
}

const ORIGIN = process.env.NEXT_PUBLIC_API_URL;
export function abs(locale: string, path: string) {
  return ORIGIN + localizedPath(locale, path);
}
