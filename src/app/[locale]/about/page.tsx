import type { Metadata } from "next";
import { locales, defaultLocale, localizedPath, Locale } from "@/i18n.config";
import { Award, Users, Target, TrendingUp, Shield, Clock, MapPin, CheckCircle, Phone, FileText, MessageSquare, Building2 } from 'lucide-react';
import { initI18next } from "@/src/app/i18n/server";
import Image from 'next/image'
import Link from '@/src/imports/Link';

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
      <>
        <section className="pt-24 pb-8 px-4 bg-[#fefdf9]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
              {/* Left - Image */}
              <div className="rounded-[24px] overflow-hidden">
                <Image
                  src="/assets/10f5baf3688d266721960b87abe3fe9722fdc500.png"
                  width={32}
                  height={48}
                  className="w-full h-auto"
                  alt="LLLMS Команда юристов"
                />
              </div>

              {/* Right - Text */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-[#87b7ce]" />
                    </div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#87b7ce] to-transparent"></div>
                  </div>
                  
                  <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[32px] leading-[1.3] text-[#29282b] mb-4">
                    О компании
                  </h2>
                  <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[20px] leading-[1.5] text-[#87b7ce] mb-6">
                    Защита прав в уголовном процессе — наша специализация с 2009 года
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] text-[18px] leading-[1.7] text-[#29282b]">
                    Мы – профессиональная юридическая компания с многолетним опытом работы в сфере уголовного права. Наша команда состоит из опытных адвокатов, которые помогли сотням клиентов защитить свои права и добиться справедливости.
                  </p>
                </div>

                <div>
                  <p className="font-['Inter:Regular',sans-serif] text-[18px] leading-[1.7] text-[#29282b]">
                    География нашей работы — <span className="font-semibold text-[#87b7ce]">Москва и Московская область</span>. Мы работаем с 2009 года и за это время накопили огромный опыт в решении самых сложных уголовных дел.
                  </p>
                </div>

                <div>
                  <p className="font-['Inter:Regular',sans-serif] text-[18px] leading-[1.7] text-[#29282b]">
                    Мы гарантируем индивидуальный подход, полную конфиденциальность и профессиональную защиту на всех стадиях уголовного процесса — от проверки до суда и обжалования приговора.
                  </p>
                </div>

                <div className="pt-4">
                  <Link />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-8 px-4 bg-[#fefdf9]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 - Закрытых дел */}
              <div className="bg-gradient-to-br from-[#3d4b5e] to-[#2a3542] rounded-[10px] border border-[#576582] px-[13px] py-3 flex gap-3 items-center">
                <div className="shrink-0 w-7 h-7">
                  <CheckCircle className="w-7 h-7 text-[#87b7ce]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-['Inter:Bold',sans-serif] font-bold text-[24px] leading-[32px] text-white">
                      500+
                    </span>
                    <span className="font-['Inter:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.9)]">
                      дел
                    </span>
                  </div>
                  <p className="font-['Inter:Regular',sans-serif] text-[12px] leading-[16px] text-[#87b7ce]">
                    успешно закрыто
                  </p>
                </div>
              </div>

              {/* Stat 2 - Процент успеха */}
              <div className="bg-gradient-to-br from-[#3d4b5e] to-[#2a3542] rounded-[10px] border border-[#576582] px-[13px] py-3 flex gap-3 items-center">
                <div className="shrink-0 w-7 h-7">
                  <TrendingUp className="w-7 h-7 text-[#87b7ce]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-['Inter:Bold',sans-serif] font-bold text-[24px] leading-[32px] text-white">
                      87%
                    </span>
                    <span className="font-['Inter:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.9)]">
                      успех
                    </span>
                  </div>
                  <p className="font-['Inter:Regular',sans-serif] text-[12px] leading-[16px] text-[#87b7ce]">
                    в пользу клиентов
                  </p>
                </div>
              </div>

              {/* Stat 3 - Опыт работы */}
              <div className="bg-gradient-to-br from-[#3d4b5e] to-[#2a3542] rounded-[10px] border border-[#576582] px-[13px] py-3 flex gap-3 items-center">
                <div className="shrink-0 w-7 h-7">
                  <Award className="w-7 h-7 text-[#87b7ce]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-['Inter:Bold',sans-serif] font-bold text-[24px] leading-[32px] text-white">
                      15+
                    </span>
                    <span className="font-['Inter:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.9)]">
                      лет
                    </span>
                  </div>
                  <p className="font-['Inter:Regular',sans-serif] text-[12px] leading-[16px] text-[#87b7ce]">
                    опыта работы
                  </p>
                </div>
              </div>

              {/* Stat 4 - Доступность */}
              <div className="bg-gradient-to-br from-[#3d4b5e] to-[#2a3542] rounded-[10px] border border-[#576582] px-[13px] py-3 flex gap-3 items-center">
                <div className="shrink-0 w-7 h-7">
                  <Clock className="w-7 h-7 text-[#87b7ce]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-['Inter:Bold',sans-serif] font-bold text-[24px] leading-[32px] text-white">
                      24/7
                    </span>
                  </div>
                  <p className="font-['Inter:Regular',sans-serif] text-[12px] leading-[16px] text-[#87b7ce]">
                    всегда на связи
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action - Narrow */}
        <section className="py-8 px-4 bg-[#fefdf9]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[1.2] text-[#252623] mb-6">
              Готовы защитить ваши права
            </h2>
            <p className="font-['Inter:Regular',sans-serif] text-[20px] leading-[1.6] text-[rgba(41,40,43,0.7)] mb-8">
              Получите бесплатную консультацию и узнайте, как мы можем помочь в вашей ситуации
            </p>
            <button className="bg-[#87b7ce] hover:bg-[#6fa3bb] transition-colors rounded-[16px] px-12 py-4 font-['Inter:Medium',sans-serif] font-medium text-[18px] text-white shadow-lg">
              Задать вопрос адвокату
            </button>

            <div className="mt-8 flex flex-wrap justify-center gap-8 text-[rgba(41,40,43,0.6)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#87b7ce] rounded-full"></div>
                <span className="font-['Inter:Medium',sans-serif] text-[14px]">Онлайн консультации</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#87b7ce] rounded-full"></div>
                <span className="font-['Inter:Medium',sans-serif] text-[14px]">Конфиденциально</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#87b7ce] rounded-full"></div>
                <span className="font-['Inter:Medium',sans-serif] text-[14px]">Без визита в офис</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contacts Section with Map */}
        <section className="py-8 px-4 bg-[#fefdf9]">
          <div className="max-w-[920px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[1.2] text-[#252623] mb-4">
                Контакты
              </h2>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 text-[#29282b]">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#87b7ce]" />
                <span className="font-['Inter:Regular',sans-serif] text-[16px]">г. Москва, ул. Юридическая, д. 1</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#87b7ce]" />
                <span className="font-['Inter:Regular',sans-serif] text-[16px]">+7 (999) 123-45-67</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#87b7ce]" />
                <span className="font-['Inter:Regular',sans-serif] text-[16px]">info@urconsult.ru</span>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-[24px] overflow-hidden shadow-lg">
              <Image
                src="/assets/3c51396355c47d641799181b140721641be0b1c3.png"
                width={0}
                height={0}
                className="w-full h-auto"
                alt="LLLMS Карта с местоположением офиса"
              />
            </div>
          </div>
        </section>
      </> 
    );
}