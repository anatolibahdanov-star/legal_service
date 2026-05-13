'use client';

import { useSession, signOut } from "next-auth/react"
import { useState } from "react";
import Link from 'next/link';
import { AuthFormWindow } from "@/src/app/components/popups/AuthFormWindow";
import { RegisterFormWindow } from "@/src/app/components/popups/RegisterFormWindow";
import { ResetPasswordFormWindow } from "@/src/app/components/popups/ResetPasswordFormWindow";
import { SwitchToLoginPrefill } from "@/src/interfaces/form";

export default function SignInComponent() {
  const [activeForm, setActiveForm] = useState<"login" | "register" | "reset" | null>(null);
  const [loginPrefillPhone, setLoginPrefillPhone] = useState<string | undefined>(undefined);
  const { data: session } = useSession()

  const switchToLogin = (prefill?: SwitchToLoginPrefill) => {
    setLoginPrefillPhone(prefill?.phone);
    setActiveForm("login");
  };
  const closeAll = () => {
    setActiveForm(null);
    setLoginPrefillPhone(undefined);
  };
  let content;
  if (session) {
    content =  (
      <>
        { session.user.role === 'user' ? (
        <Link href="/profile/"  
          className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-2 py-2.5 rounded-lg transition-colors flex items-center font-small">
        Личный кабинет
        </Link>) : (
          <Link href="/admin/"
            className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-2 py-2.5 rounded-lg transition-colors flex items-center font-small">
          Админка
          </Link>
        )}
        <button className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-2 py-2.5 rounded-lg transition-colors flex items-center font-small" onClick={() => signOut({ callbackUrl: '/' })}>Выйти</button>
      </>
    )
  } else {
    content = (
        <button className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center font-small" onClick={() => setActiveForm("login")}>Войти</button>
    )
  }

  return (
    <>
      {content}
      {/* Modals */}
      <AuthFormWindow
        isOpen={activeForm === "login"}
        onClose={closeAll}
        onSwitchToRegister={() => {
          setLoginPrefillPhone(undefined);
          setActiveForm("register");
        }}
        onSwitchToReset={() => setActiveForm("reset")}
        prefillPhone={loginPrefillPhone}
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
  )
}