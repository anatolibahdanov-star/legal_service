
import Image from 'next/image'
import { initI18next } from "@/src/app/i18n/server";
import type { Locale } from "@/i18n.config";
import { StatsBar } from "@/src/app/components/stats-bar";
import { Hero } from "@/src/app/components/hero";
import { AboutUs } from "@/src/app/components/about-us";
import { HowItWorks } from "@/src/app/components/how-it-works";
import { Services } from "@/src/app/components/services";
import {SelectCategories} from "@/src/app/components/data/select-category"

export default async function Home({
  params,
}: {
  params: { locale: Locale };
}) {
  const {locale} = await params
  const namespaces = ["translation", "home"] as const;

  const i18n = await initI18next(locale, [...namespaces]);
  const tHome = i18n.getFixedT(locale, "home");

  return (
    <>
      <StatsBar />
      <Hero><SelectCategories /></Hero>
      <AboutUs />
      <HowItWorks />
      <Services />
    </>
  );
}
