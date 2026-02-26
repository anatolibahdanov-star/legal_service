'use client'; 

import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react";
import Link from 'next/link';
import { AuthForm } from "@/src/app/components/AuthForm";
import { RegisterForm } from "@/src/app/components/RegisterForm";
import { ResetPasswordForm } from "@/src/app/components/ResetPasswordForm";
import { UserSettingsForm } from "@/src/app/components/UserSettingsForm";
import { RequestHistoryForm } from "@/src/app/components/RequestHistoryForm";

export default function SignInComponent() {
  const [activeForm, setActiveForm] = useState<"login" | "register" | "reset" | "settings" | "history" | null>(null);
  const { data: session } = useSession()
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
      {/* Модальные окна */}
      <AuthForm 
        isOpen={activeForm === "login"} 
        onClose={() => setActiveForm(null)}
        onSwitchToRegister={() => setActiveForm("register")}
        onSwitchToReset={() => setActiveForm("reset")}
      />
      <RegisterForm 
        isOpen={activeForm === "register"} 
        onClose={() => setActiveForm(null)}
        onSwitchToLogin={() => setActiveForm("login")}
      />
      <ResetPasswordForm 
        isOpen={activeForm === "reset"} 
        onClose={() => setActiveForm(null)}
        onSwitchToLogin={() => setActiveForm("login")}
      />
      <UserSettingsForm 
        isOpen={activeForm === "settings"} 
        onClose={() => setActiveForm(null)}
      />
      <RequestHistoryForm 
        isOpen={activeForm === "history"} 
        onClose={() => setActiveForm(null)}
      />
    </>
  )
}