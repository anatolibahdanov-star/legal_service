"use client";
import React from "react";
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

  return (
    <>
    {/* Header */}
    <header id="header" className={`${styles.header} ${styles[mode]} ${underAppBar ? styles.underAppBar : ''}`}>
        <div id="container" className={styles.container}>

            <Link
              href="/"
              id="logo"
              className="text-[#12161B] font-semibold text-[28px] leading-none tracking-tight transition-opacity duration-200 hover:opacity-70 active:opacity-50"
            >
              ЭНКИ
            </Link>

            {!hideNav && (
            <nav id="navigation" className={`${styles.navigation} flex items-center gap-4`}>
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

            {actuallyAuthenticated ? (
              <div className="flex items-center gap-2">
                  {session?.user?.role === 'user' ? (
                    <Link 
                      href="/profile/"
                      className="flex items-center justify-center px-6 h-12 rounded-3xl text-[18px] font-medium leading-[23px] tracking-tight text-white transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
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
                      className="flex items-center justify-center px-6 h-12 rounded-3xl text-[18px] font-medium leading-[23px] tracking-tight text-white transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
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
                    className="flex items-center justify-center px-6 h-12 rounded-3xl text-[18px] font-medium leading-[23px] tracking-tight text-white transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
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
                className="flex items-center justify-center px-6 h-12 rounded-3xl text-[18px] font-medium leading-[23px] tracking-tight text-white transition-all duration-150 hover:opacity-85 hover:scale-105 active:scale-90 active:opacity-60 active:brightness-75 cursor-pointer"
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