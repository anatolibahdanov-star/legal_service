import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from 'i18next-browser-languagedetector';
import { defaultLocale } from "@/i18n.config";

// Load JSON resources from src/locales/<locale>/<namespace>.json
const backend = resourcesToBackend(
  (locale: string, namespace: string) =>
    import(`../../locales/${locale}/${namespace}.json`)
);

export async function initI18next(
  locale: string,
  namespaces: string[] = ["common"]
) {
  const i18n = createInstance();
  await i18n
    .use(initReactI18next)
    .use(backend)
    .use(LanguageDetector) 
    .init({
      lng: locale,
      // debug: true,
      fallbackLng: defaultLocale,
      ns: namespaces,
      defaultNS: "translation",
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      detection: {
          order: ['querystring', 'cookie', 'localStorage', 'navigator'], // Order of detection sources
          lookupQuerystring: "lang",
          caches: ['cookie'], // Cache the detected language
      },
      supportedLngs: ['en', 'fr', 'es', 'ru'],
    });
  return i18n;
}