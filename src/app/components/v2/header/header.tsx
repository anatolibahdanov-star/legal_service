"use client";
import React, { useState } from "react";
import Link from "next/link";
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const id = href.split("#")[1];
    if (!id) return;
    // На мобиле секции landing имеют префикс m-; десктопные скрыты.
    const target =
      document.getElementById(`m-${id}`) ?? document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderAuthActions = (placement: 'header' | 'menu') => {
    const isMenu = placement === 'menu';
    const className = isMenu ? styles.menuAuthBtn : styles.navBtn;

    if (actuallyAuthenticated) {
      return (
        <>
          {session?.user?.role === 'user' ? (
            <Link
              href="/profile/?tab=cases"
              onClick={isMenu ? closeMobileMenu : undefined}
              className={className}
            >
              Личный кабинет
            </Link>
          ) : (
            <Link
              href="/admin/"
              onClick={isMenu ? closeMobileMenu : undefined}
              className={className}
            >
              Кабинет
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
    {/* Header */}
    <header id="header" className={`${styles.header} ${styles[mode]} ${underAppBar ? styles.underAppBar : ''} ${hideNav ? styles.hideNav : ''}`}>
        <div id="container" className={styles.container}>

            <Link
              href="/"
              id="logo"
              className="text-[#12161B] font-semibold text-[22px] md:text-[28px] leading-none tracking-tight transition-opacity duration-200 hover:opacity-70 active:opacity-50"
            >
              ЭНКИ
            </Link>

            {!hideNav && (
            <nav id="navigation" className={`${styles.navigation} hidden lg:flex items-center gap-4`}>
                <ul className="flex items-center gap-1">
                    {NAV_LINKS.map(({ label, href }) => (
                      <li key={label}>
                        <Link
                          href={href}
                          className="relative px-3 py-2 text-[18px] font-medium leading-[23px] tracking-tight text-[#12161B] transition-colors duration-200 hover:text-[#34347C] active:text-[#1a1a5e] group"
                        >
                          {label}
                          <span className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-[#34347C] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
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
    
    {/* Modals */}
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