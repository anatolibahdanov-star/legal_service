"use client";

import * as React from "react";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { defaultLocale } from "@/i18n.config";
import LanguageDetector from 'i18next-browser-languagedetector';

const backend = resourcesToBackend(
  (locale: string, namespace: string) =>
    import(`../locales/${locale}/${namespace}.json`)
);

type Props = {
  locale: string;
  namespaces?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resources?: Record<string, any>; // { ns: bundle }
  children: React.ReactNode;
};

export default function I18nProvider({
  locale,
  namespaces = ["translation"],
  resources,
  children,
}: Props) {
  const [i18n] = React.useState(() => {
    const i = createInstance();

    i.use(initReactI18next)
      .use(backend)
      .use(LanguageDetector) 
      .init({
        lng: locale,
        // debug: true,
        fallbackLng: defaultLocale,
        ns: namespaces,
        resources: resources ? { [locale]: resources } : undefined,
        defaultNS: "translation",
        interpolation: { escapeValue: false },
        react: { useSuspense: false },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'navigator'], // Order of detection sources
            lookupQuerystring: "lang",
            caches: ['cookie'], // Cache the detected language
        },
        supportedLngs: ['en', 'fr', 'es', 'ru'], // List of supported languages
      });

    return i;
  });

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}