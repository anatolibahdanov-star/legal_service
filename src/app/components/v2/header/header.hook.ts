import { useState } from 'react'
import { useSession, signOut } from "next-auth/react"
import { SwitchToLoginPrefill } from "@/src/interfaces/form"

interface UseHeaderProps {
  isAuthenticated?: boolean
  userName?: string
  userInitials?: string
}

export const useHeader = ({ 
  isAuthenticated = false,
  userName = "Иван Иванов",
  userInitials = "ИИ"
}: UseHeaderProps = {}) => {
  
  const [activeForm, setActiveForm] = useState<"login" | "register" | "reset" | null>(null)
  const [loginPrefillPhone, setLoginPrefillPhone] = useState<string | undefined>(undefined)
  const [loginPrefillOtpSent, setLoginPrefillOtpSent] = useState<boolean>(false)
  const { data: session } = useSession()
  
  const handleAuthClick = () => {
    setActiveForm("login")
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const switchToLogin = (prefill?: SwitchToLoginPrefill) => {
    setLoginPrefillPhone(prefill?.phone)
    setLoginPrefillOtpSent(!!prefill?.otpAlreadySent)
    setActiveForm("login")
  }

  const switchToRegister = () => {
    setLoginPrefillPhone(undefined)
    setLoginPrefillOtpSent(false)
    setActiveForm("register")
  }

  const switchToReset = () => {
    setActiveForm("reset")
  }

  const closeAll = () => {
    setActiveForm(null)
    setLoginPrefillPhone(undefined)
    setLoginPrefillOtpSent(false)
  }

  // Determine if user is actually authenticated
  const actuallyAuthenticated = session ? true : isAuthenticated
  const actualUserName = session?.user?.name || userName
  const actualUserInitials = session?.user?.name 
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : userInitials

  return {
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
  }
}