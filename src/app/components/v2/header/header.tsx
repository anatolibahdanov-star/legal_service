"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./header.module.css";

import { NAV_LINKS } from "./header.data";
import { useHeader } from "./header.hook";
import { AuthFormWindow } from "@/src/app/components/popups/AuthFormWindow";
import { RegisterFormWindow } from "@/src/app/components/popups/RegisterFormWindow";
import { ResetPasswordFormWindow } from "@/src/app/components/popups/ResetPasswordFormWindow";

interface HeaderProps {
  isAuthenticated?: boolean
  userName?: string
  userInitials?: string
  mode?: 'fixed' | 'sticky' | 'static'
  hideNav?: boolean
  underAppBar?: boolean
}

export const Header: React.FC<HeaderProps> = ({ 
  isAuthenticated = false,
  userName = "Иван Иванов",
  userInitials = "ИИ",
  mode = 'sticky',
  hideNav = false,
  underAppBar = false,
}) => {
  const {
    isAuthenticated: actuallyAuthenticated,
    session,
    activeForm,
    loginPrefillPhone,
    loginPrefillOtpSent,
    loginPrefillExpiresInSec,
    handleAuthClick,
    handleLogout,
    switchToLogin,
    switchToRegister,
    switchToReset,
    closeAll,
  } = useHeader({ isAuthenticated, userName, userInitials });

  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overDarkHero, setOverDarkHero] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') return
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const hero = document.getElementById('hero')
      if (!isMobile || !hero) {
        setOverDarkHero(false)
        return
      }
      const heroBottom = hero.getBoundingClientRect().bottom
      setOverDarkHero(heroBottom > 120)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (headerRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (href: string) => {
    const id = href.split("#")[1];
    if (!id) return false;
    const target =
      document.getElementById(`m-${id}`) ?? document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!scrollToSection(href)) return;
    e.preventDefault();
    if (window.location.hash !== `#${href.split("#")[1]}`) {
      window.history.pushState(null, "", href.startsWith("/") ? href : `/${href}`);
    }
  };

  const handleMobileNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    handleNavClick(e, href);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderAuthActions = (placement: 'header' | 'menu') => {
    const isMenu = placement === 'menu';
    const className = isMenu ? styles.menuAuthBtn : styles.navBtn;

    if (actuallyAuthenticated) {
      return (
        <>
          {session?.user?.role === 'user' && (
            <Link
              href="/profile/?tab=cases"
              onClick={isMenu ? closeMobileMenu : undefined}
              className={className}
            >
              Личный кабинет
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              handleLogout();
              if (isMenu) closeMobileMenu();
            }}
            className={className}
          >
            Выйти
          </button>
        </>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          handleAuthClick();
          if (isMenu) closeMobileMenu();
        }}
        className={className}
      >
        Войти
      </button>
    );
  };

  return (
    <>
    <header
      ref={headerRef}
      id="header"
      className={`${styles.header} ${styles[mode]} ${underAppBar ? styles.underAppBar : ''} ${hideNav ? styles.hideNav : ''} ${overDarkHero ? styles.headerOverHero : ''}`}
    >
        <div id="container" className={styles.container}>

            <Link
              href="/"
              id="logo"
              className={styles.logo}
              onClick={closeMobileMenu}
            >
              ЭНКИ
            </Link>

            {!hideNav && (
            <nav id="navigation" className={`${styles.navigation} hidden lg:flex items-center gap-4`}>
                <ul className="flex items-center gap-1">
                    {NAV_LINKS.map(({ label, href }) => (
                      <li key={label} className="flex items-center">
                        <Link
                          href={href}
                          onClick={(e) => handleNavClick(e, href)}
                          className={styles.navLink}
                        >
                          {label}
                          <span className={styles.navLinkUnderline} />
                        </Link>
                      </li>
                    ))}
                </ul>
            </nav>
            )}

            <div className={styles.actions}>
              <div className={styles.headerAuthBtns}>
                {renderAuthActions('header')}
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Меню"
                aria-expanded={mobileMenuOpen}
                className={styles.burger}
              >
                {mobileMenuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                )}
              </button>
            </div>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            {!hideNav && (
              <nav className={styles.mobileMenuNav}>
                {NAV_LINKS.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    onClick={(e) => handleMobileNavClick(e, href)}
                    className={styles.mobileMenuLink}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            )}

            <div className={`${styles.mobileMenuAuth} ${hideNav ? styles.mobileMenuAuthOnly : ''}`}>
              {renderAuthActions('menu')}
            </div>
          </div>
        )}
    </header>

    <AuthFormWindow
      isOpen={activeForm === "login"}
      onClose={closeAll}
      onSwitchToRegister={switchToRegister}
      onSwitchToReset={switchToReset}
      prefillPhone={loginPrefillPhone}
      prefillPhoneOtpSent={loginPrefillOtpSent}
      prefillExpiresInSec={loginPrefillExpiresInSec}
    />
    <RegisterFormWindow
      isOpen={activeForm === "register"}
      onClose={closeAll}
      onSwitchToLogin={switchToLogin}
    />
    <ResetPasswordFormWindow
      isOpen={activeForm === "reset"}
      onClose={closeAll}
      onSwitchToLogin={switchToLogin}
    />
    </>
  );
}
