import { useEffect, useState } from 'react'
import { useSession, signOut } from "next-auth/react"
import { SwitchToLoginPrefill } from "@/src/interfaces/form"
import { clearAllPendingPurchases, subscribeOpenAuth } from "@/src/libs/authIntent"

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
  const [loginPrefillExpiresInSec, setLoginPrefillExpiresInSec] = useState<number | undefined>(undefined)
  const { data: session } = useSession()

  useEffect(() => {
    return subscribeOpenAuth((detail) => {
      const form = detail.form ?? 'login'
      if (form === 'register') {
        setLoginPrefillPhone(undefined)
        setLoginPrefillOtpSent(false)
        setLoginPrefillExpiresInSec(undefined)
        setActiveForm('register')
        return
      }
      if (form === 'reset') {
        setActiveForm('reset')
        return
      }
      setActiveForm('login')
    })
  }, [])
  
  const handleAuthClick = () => {
    // Manual "Войти" should not resume a previously abandoned purchase intent.
    clearAllPendingPurchases()
    setActiveForm("login")
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const switchToLogin = (prefill?: SwitchToLoginPrefill) => {
    setLoginPrefillPhone(prefill?.phone)
    setLoginPrefillOtpSent(!!prefill?.otpAlreadySent)
    setLoginPrefillExpiresInSec(prefill?.expiresInSec)
    setActiveForm("login")
  }

  const switchToRegister = () => {
    setLoginPrefillPhone(undefined)
    setLoginPrefillOtpSent(false)
    setLoginPrefillExpiresInSec(undefined)
    setActiveForm("register")
  }

  const switchToReset = () => {
    setActiveForm("reset")
  }

  const closeAll = () => {
    setActiveForm(null)
    setLoginPrefillPhone(undefined)
    setLoginPrefillOtpSent(false)
    setLoginPrefillExpiresInSec(undefined)
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
    loginPrefillExpiresInSec,
    handleAuthClick,
    handleLogout,
    switchToLogin,
    switchToRegister,
    switchToReset,
    closeAll,
  }
}