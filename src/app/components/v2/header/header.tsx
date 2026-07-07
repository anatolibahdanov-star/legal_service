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

  return (
    <>
    {/* Header */}
    <header id="header" className={`${styles.header} ${styles[mode]} ${underAppBar ? styles.underAppBar : ''}`}>
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

            <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Меню"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl bg-[rgba(18,22,27,0.05)] text-[#12161B] transition-colors hover:bg-[rgba(18,22,27,0.1)] active:bg-[rgba(18,22,27,0.15)] cursor-pointer"
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              )}
            </button>
            {actuallyAuthenticated ? (
              <div className="flex items-center gap-2">
                  {session?.user?.role === 'user' ? (
                    <Link 
                      href="/profile/"
                      className="flex items-center justify-center px-4 md:px-6 h-10 md:h-12 rounded-3xl text-[14px] md:text-[18px] font-medium leading-[23px] tracking-tight text-white whitespace-nowrap transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
                      style={{
                        background: '#12161B',
                        border: '0.5px solid rgba(255,255,255,0.5)',
                        boxShadow: '0px 2px 8px 0px rgba(30,47,72,0.06)',
                      }}
                    >
                      Личный кабинет
                    </Link>
                  ) : (
                    <Link 
                      href="/admin/"
                      className="flex items-center justify-center px-4 md:px-6 h-10 md:h-12 rounded-3xl text-[14px] md:text-[18px] font-medium leading-[23px] tracking-tight text-white whitespace-nowrap transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
                      style={{
                        background: '#12161B',
                        border: '0.5px solid rgba(255,255,255,0.5)',
                        boxShadow: '0px 2px 8px 0px rgba(30,47,72,0.06)',
                      }}
                    >
                      Кабинет
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center px-4 md:px-6 h-10 md:h-12 rounded-3xl text-[14px] md:text-[18px] font-medium leading-[23px] tracking-tight text-white whitespace-nowrap transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
                    style={{
                      background: '#12161B',
                      border: '0.5px solid rgba(255,255,255,0.5)',
                      boxShadow: '0px 2px 8px 0px rgba(30,47,72,0.06)',
                    }}
                  >
                    Выйти
                  </button>
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="flex items-center justify-center px-4 md:px-6 h-10 md:h-12 rounded-3xl text-[14px] md:text-[18px] font-medium leading-[23px] tracking-tight text-white whitespace-nowrap transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
                style={{
                  background: '#12161B',
                  border: '0.5px solid rgba(255,255,255,0.5)',
                  boxShadow: '0px 2px 8px 0px rgba(30,47,72,0.06)',
                }}
              >
                {/* TODO: i18n need to be here */}
                Войти
              </button>
            )}
            </div>
        </div>

        {mobileMenuOpen && !hideNav && (
          <div className="lg:hidden absolute left-0 right-0 top-full mt-2 rounded-3xl border border-[rgba(18,22,27,0.1)] bg-white/95 p-2 shadow-[0_2px_72px_0_rgba(21,22,25,0.2)] backdrop-blur-md">
            <nav className="flex flex-col">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => handleMobileNavClick(e, href)}
                  className="rounded-2xl px-4 py-3 text-[16px] font-medium text-[#12161B] transition-colors hover:bg-black/5 active:bg-black/10"
                >
                  {label}
                </a>
              ))}
            </nav>
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