// ===== OLD V1 DESIGN (COMMENTED OUT - REPLACED WITH V2) =====
// import { initI18next } from "@/src/app/i18n/server";
// import type { Locale } from "@/i18n.config";
// import { StatsBar } from "@/src/app/components/StatsBar";
// import { Hero } from "@/src/app/components/Hero";
// import { AboutUs } from "@/src/app/components/AboutUs";
// import { HowItWorks } from "@/src/app/components/HowItWorks";
// import { Services } from "@/src/app/components/Services";

// export default async function Home({
//   params,
// }: {
//   params: { locale: Locale };
// }) {
//   // const {locale} = await params
//   // const namespaces = ["translation", "home"] as const;

//   // const i18n = await initI18next(locale, [...namespaces]);
//   // const tHome = i18n.getFixedT(locale, "home");

//   return (
//     <>
//       <StatsBar />
//       <Hero />
//       <AboutUs />
//       <HowItWorks />
//       <Services />
//     </>
//   );
// }
// ===== END OLD V1 DESIGN =====

// ===== NEW V2 DESIGN =====
import Image from 'next/image'
import heroImage from '@/public/design/v2-main-page/hero-image.jpg'
import type { Locale } from "@/i18n.config";

import { InquirySection } from '@/src/app/components/v2/inquiry-section/inquiry-section'
import { HowItWorks } from '@/src/app/components/v2/how-it-works/how-it-works'
import { WhyUs } from '@/src/app/components/v2/why-us/why-us'
import { Services } from '@/src/app/components/v2/services/services'

export default function Home({
  params: _params,
}: {
  params: { locale: Locale };
}) {
  return (
    <main id="main-landing-page" className="min-h-screen bg-[#F9F9F9] text-[#12161B]">
      <section id="hero" className="relative w-full overflow-hidden" style={{ height: 780 }}>
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt="ENKI hero background"
            priority
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/30 z-10 md:hidden" />
        </div>

        <div className="relative z-10 w-full h-full max-w-[1440px] mx-auto px-[100px] flex items-end pb-[120px]">
          <h1
            className="text-white font-medium leading-[70px] tracking-[-0.01em] max-w-[615px]"
            style={{ fontSize: 64 }}
          >
            Задавайте вопросы опытным юристам онлайн
          </h1>
        </div>
      </section>

      <InquirySection />

      <HowItWorks />

      <WhyUs />

      <Services />
    </main>
  )
}
