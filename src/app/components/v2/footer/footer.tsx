'use client'

import Image from 'next/image'
import Link from 'next/link'
import footerLogo from '@/public/design/v2-main-page/icons/footer-logo.svg'
import { QUICK_LINKS, DOCUMENTS, COMPANY_INFO } from './footer.data'
import { useFooter } from './footer.hook'

export const Footer = () => {
  const { handleScrollToTop } = useFooter()
  return (
    <footer
      id="footer"
      className="relative w-full overflow-hidden bg-[#0E493D] pt-[60px] md:pt-[90px] pb-[120px] md:pb-[280px]"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-[100px]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[80px]">
          <div className="flex flex-col gap-[10px] w-[180px] md:w-[220px]">
            <Image src={footerLogo} alt="ЭНКИ" width={220} height={65} className="h-auto w-full" />
          </div>

          <div className="flex flex-col gap-10 lg:flex-row lg:flex-wrap lg:gap-[100px]">
            <div className="flex flex-col gap-8 w-full sm:w-[320px]">
              <p className="text-[16px] leading-[22px] tracking-tight text-white">
                {COMPANY_INFO.description}
              </p>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                  <span className="text-[16px] leading-[22px] text-white">Реквизиты</span>
                  <div className="w-full border-t border-white" />
                </div>
                <div className="flex flex-col gap-1 text-[14px] leading-[18px] text-white/80">
                  <span className="font-medium">{COMPANY_INFO.name}</span>
                  <span>ОГРН: {COMPANY_INFO.ogrn}</span>
                  <span>ИНН: {COMPANY_INFO.inn}</span>
                  <a 
                    href={`mailto:${COMPANY_INFO.email}`} 
                    className="hover:text-white/60 active:text-white/40 transition-colors duration-150"
                  >
                    {COMPANY_INFO.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 w-full lg:w-[160px] lg:h-[300px]">
              <div className="flex flex-col">
                {QUICK_LINKS.map((link) => (
                  <div key={link.label} className="flex items-center h-8">
                    <Link
                      href={link.href}
                      className="text-[12px] leading-5 text-white/75 hover:text-white active:text-white/60 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </div>
                ))}
              </div>
              
              <p className="text-[12px] leading-5 text-white/65">
                © 2026 All rights reserved.
              </p>
            </div>

            <div className="flex flex-col w-full lg:w-[220px]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <span className="text-[16px] leading-[22px] text-white">Документы</span>
                  <div className="w-full border-t border-white" />
                </div>
                <div className="flex flex-col gap-3">
                  {DOCUMENTS.map((doc) => (
                    <a
                      key={doc.label}
                      href={doc.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] leading-[16px] text-white/75 hover:text-white active:text-white/60 transition-colors"
                    >
                      {doc.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleScrollToTop}
            className="flex items-center justify-center bg-white rounded-full transition-all duration-150 hover:opacity-90 hover:-translate-y-1 hover:scale-105 active:scale-85 active:opacity-60 active:translate-y-0 cursor-pointer"
            style={{ width: 56, height: 56, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
            aria-label="Наверх"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M5 12l7-7 7 7" stroke="#0E493D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div
        className="absolute bottom-8 md:bottom-16 left-0 right-0 flex items-center justify-between px-6 md:px-20 pointer-events-none select-none"
      >
        {['Э', 'Н', 'К', 'И'].map((letter) => (
          <span
            key={letter}
            className="font-bold text-[64px] leading-[64px] lg:text-[180px] lg:leading-[180px]"
            style={{ color: 'rgba(255,255,255,0.02)' }}
          >
            {letter}
          </span>
        ))}
      </div>
      </div>
    </footer>
  )
}
