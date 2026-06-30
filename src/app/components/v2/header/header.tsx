"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./header.module.css";

import logo from "@/public/design/v2-main-page/icons/header-logo.svg";
import { NAV_LINKS, SOCIAL_LINKS } from "./header.data";
import { useHeader } from "./header.hook";
import { AuthFormWindow } from "@/src/app/components/popups/AuthFormWindow";
import { RegisterFormWindow } from "@/src/app/components/popups/RegisterFormWindow";
import { ResetPasswordFormWindow } from "@/src/app/components/popups/ResetPasswordFormWindow";
// import HeaderBalance from "@/src/app/components/HeaderBalance";

interface HeaderProps {
  isAuthenticated?: boolean
  userName?: string
  userInitials?: string
}

export const Header: React.FC<HeaderProps> = ({ 
  isAuthenticated = false,
  userName = "Иван Иванов",
  userInitials = "ИИ"
}) => {
  const {
    isAuthenticated: actuallyAuthenticated,
    userName: actualUserName,
    userInitials: actualUserInitials,
    session,
    activeForm,
    loginPrefillPhone,
    loginPrefillOtpSent,
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
    <header id="header" className={styles.header}>
        <div id="container" className={styles.container}>

            <Link
              href="/"
              id="logo"
              className="flex items-center gap-2 text-[#12161B] font-semibold text-[18px] transition-opacity duration-200 hover:opacity-70 active:opacity-50"
            >
                <Image src={logo} alt="ENKI logo" width={31.45} height={36} />
                {/* TODO: i18n need to be here */}
                <span>ЭНКИ</span>
            </Link>

            <nav id="navigation" className="flex items-center gap-4 ml-auto">
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

            <nav className="flex items-center gap-1 ml-auto">
                <ul className="flex items-center gap-1">
                    {SOCIAL_LINKS.map(({ src, alt, href }) => (
                      <li key={alt}>
                        <Link
                          href={href}
                          className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:bg-black/5 active:bg-black/10 active:scale-95"
                        >
                          <Image src={src} alt={alt} width={24} height={24} />
                        </Link>
                      </li>
                    ))}
                </ul>
            </nav>

            {actuallyAuthenticated ? (
              <div className="flex flex-col items-end gap-1.5">
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
                {/* <HeaderBalance /> */}
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