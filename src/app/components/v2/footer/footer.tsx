'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import footerLogo from '@/public/design/v2-main-page/icons/footer-logo.svg'
import { QUICK_LINKS, DOCUMENTS, COMPANY_INFO } from './footer.data'
import { useFooter } from './footer.hook'
import { isStaffRole } from '@/src/app/components/v2/lawyer-requests/staff-gate'
import styles from './footer.module.css'

const LETTERS = ['Э', 'Н', 'К', 'И'] as const

export const Footer = () => {
  const { handleScrollToTop } = useFooter()
  const { data: session } = useSession()
  const quickLinks = isStaffRole(session?.user?.role)
    ? QUICK_LINKS.filter((link) => link.href !== '/#inquiry')
    : QUICK_LINKS

  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.desktopBlock}>
        <div className={styles.desktopInner}>
          <div className={styles.desktopRow}>
            <div className={styles.desktopMain}>
              <div className={styles.logoWrap}>
                <Image
                  src={footerLogo}
                  alt="ЭНКИ"
                  width={220}
                  height={65}
                  className={styles.logo}
                />
              </div>

              <div className={styles.desktopColumns}>
                <div className={styles.sectionBlock} style={{ gap: 32, maxWidth: 320 }}>
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionBlock} style={{ gap: 12 }}>
                      <span className={styles.sectionHeading}>Реквизиты</span>
                      <div className={styles.sectionLine} />
                    </div>
                    <div className={styles.requisites}>
                      <span className={styles.requisitesName}>{COMPANY_INFO.name}</span>
                      <span>ОГРН: {COMPANY_INFO.ogrn}</span>
                      <span>ИНН: {COMPANY_INFO.inn}</span>
                      <a
                        href={`mailto:${COMPANY_INFO.email}`}
                        className={styles.emailLink}
                      >
                        {COMPANY_INFO.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className={styles.linksColumn}>
                  <div className={styles.linksList}>
                    {quickLinks.map((link) => (
                      <div key={link.label} className={styles.linkItem}>
                        <Link href={link.href} className={styles.footerLink}>
                          {link.label}
                        </Link>
                      </div>
                    ))}
                  </div>

                  <p className={styles.copyright}>© 2026 Все права защищены</p>
                </div>

                <div className={styles.documentsColumn}>
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionBlock} style={{ gap: 12 }}>
                      <span className={styles.sectionHeading}>Документы</span>
                      <div className={styles.sectionLine} />
                    </div>
                    <div className={styles.documentsList}>
                      {DOCUMENTS.map((doc) => (
                        <a
                          key={doc.label}
                          href={doc.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.documentLink}
                        >
                          {doc.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.desktopArrowWrap}>
              <button
                type="button"
                onClick={handleScrollToTop}
                className={styles.scrollTopBtn}
                aria-label="Наверх"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="#0E493D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mobileBlock}>
        <div className={styles.logoWrap}>
          <Image
            src={footerLogo}
            alt="ЭНКИ"
            width={135}
            height={40}
            className={styles.logo}
          />
        </div>

        <div className={styles.mobileInfo}>
          <div className={styles.mobileTextBlock}>
            <p className={styles.mobileCopyright}>© 2026 Все права защищены</p>
          </div>

          <div className={styles.mobileLinks}>
            {quickLinks.map((link) => (
              <div key={link.label} className={styles.mobileLinkItem}>
                <Link href={link.href} className={styles.mobileLink}>
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          <div className={styles.mobileContacts}>
            <div className={styles.mobileContactsTitle}>
              <span className={styles.mobileContactsHeading}>Реквизиты</span>
              <div className={styles.mobileContactsLine} />
            </div>
            <div className={styles.mobileRequisites}>
              <span className={styles.mobileRequisitesName}>{COMPANY_INFO.name}</span>
              <span>ОГРН: {COMPANY_INFO.ogrn}</span>
              <span>ИНН: {COMPANY_INFO.inn}</span>
            </div>
          </div>

          <div className={styles.mobileContacts}>
            <div className={styles.mobileContactsTitle}>
              <span className={styles.mobileContactsHeading}>Документы</span>
              <div className={styles.mobileContactsLine} />
            </div>
            <div className={styles.mobileDocumentsList}>
              {DOCUMENTS.map((doc) => (
                <a
                  key={doc.label}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mobileDocumentLink}
                >
                  {doc.label}
                </a>
              ))}
            </div>
          </div>

          <div className={styles.mobileContacts}>
            <div className={styles.mobileContactsTitle}>
              <span className={styles.mobileContactsHeading}>Контакты</span>
              <div className={styles.mobileContactsLine} />
            </div>
            <a href={`mailto:${COMPANY_INFO.email}`} className={styles.mobileContactsEmail}>
              {COMPANY_INFO.email}
            </a>
          </div>
        </div>
      </div>

      <div className={styles.lettersMobile} aria-hidden>
        {LETTERS.map((letter) => (
          <span key={letter} className={styles.letter}>
            {letter}
          </span>
        ))}
      </div>

      <div className={styles.lettersDesktop} aria-hidden>
        {LETTERS.map((letter) => (
          <span key={letter} className={styles.letter}>
            {letter}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={handleScrollToTop}
        className={`${styles.scrollTopBtn} ${styles.mobileScrollTop}`}
        aria-label="Наверх"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="#0E493D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </footer>
  )
}
