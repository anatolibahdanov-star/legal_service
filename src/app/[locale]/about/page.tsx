import type { Metadata } from "next";
import { locales, defaultLocale, localizedPath, Locale } from "@/i18n.config";
import { initI18next } from "@/src/app/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;

  // Import the correct JSON bundle from src/locales
  const messages = (await import("@/src/locales/" + locale + "/about.json"))
    .default;

  const languages = Object.fromEntries(
    locales.map((locale) => [locale, localizedPath(locale, "/about")])
  );

  return {
    title: messages.title,
    description: messages.description,
    alternates: {
      canonical: localizedPath(locale, "/about"),
      languages: { ...languages, "x-default": "/about" },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const {locale} = await params
  const namespaces = ["translation", "about"] as const;

  const i18n = await initI18next(locale, [...namespaces]);
  const tAbout = i18n.getFixedT(locale, "about");
  const tCommon = i18n.getFixedT(locale);

  return (
    <div className="content">
        <h1>{tAbout("title")} 2222</h1>
        <h2>{tCommon("title")} 3333</h2>
        <h2>{tCommon("description")} 4444</h2>
        <h3>{tAbout("description")} 5555</h3>
    </div>  
    );
}