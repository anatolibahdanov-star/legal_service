import { useState } from "react";
import { useSession, getSession } from "next-auth/react"
import { DBUser } from "@/src/interfaces/db";
import { redirect } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface AuthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}

export function AuthForm({ isOpen, onClose, onSwitchToRegister, onSwitchToReset }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", common: "" });
  const { data: session, update } = useSession()

  const validateForm = () => {
    const newErrors = { email: "", password: "", common: "" };
    let isValid = true;

    // Валидация email
    if (!email.trim()) {
      newErrors.email = "Пожалуйста, введите адрес электронной почты";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Пожалуйста, введите корректный адрес электронной почты";
      isValid = false;
    }

    // Валидация пароля
    if (!password) {
      newErrors.password = "Пожалуйста, введите пароль";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  async function submitAuthFormAction(_email: string, _password: string): Promise<DBUser|null> {
    const email = _email;
    const password = _password;
    console.log('submit action', email, password)

    const api_url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';
    const openapi_request_timeout = parseInt(process.env.NEXT_PUBLIC_OPENAI_TIMEOUT ?? '1')
    const request = { "email": email, "password": password}
    // Call your external API here
    const response = await fetch(api_url + "/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(openapi_request_timeout * 60 * 1000)
    });

    console.log('submit action response', response)

    if (!response.ok) {
      // throw new Error("Failed to submit form");
      console.log("Technical issue with submit form", response, _email, _password)
      const msg = "Technical issue. Please try again"
      return null
    }

    const result = await response.json();
    console.log('submit action result', result)
    const msg = "Your request successfully received. Please wait for our response ASAP on special reply page created for you."
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Start session:", session)
    if (validateForm()) {
      const credentials = {username: email, password: password}
      console.log("Вход:", { email, password });
      const response = await signIn('credentials', {
        ...credentials,
        redirect: false, // Prevents automatic redirect
      });
      console.log('handleSubmit result', response)
      if(!response?.ok) {
        const newErrors = { email: "", password: "", common: "" };
        console.error("Incorrect response", response?.error)
        newErrors.common = response?.error ? response.error : "Произошла техническая ошибка1. Попробуйте авторизироваться еще раз.";
        setErrors(newErrors);
        return false
      }
      
      // Upon successful sign-in, immediately trigger a session update
      await update(); 

      const session = await getSession();
      const user = session?.user
      if(user === null) {
          const newErrors = { email: "", password: "", common: "" };
          console.error("Incorrect response", user)
          newErrors.common = "Произошла техническая ошибка2. Попробуйте авторизироваться еще раз.";
          setErrors(newErrors);
          return false
      }

      console.log('handleSubmit user', user)
      onClose()
      if(user?.role !== "user") {
        redirect('/admin');
      } else {
        redirect('/en/profile?msg=1');
      }
      
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#3d4b5e] rounded-[24px] p-[40px] w-full max-w-[540px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-[20px] right-[20px] text-white/60 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Заголовок */}
        <div className="mb-[32px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[12px]">
            Вход в систему
          </h1>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[22.75px] text-[14px] text-[rgba(255,255,255,0.8)]">
            Войдите в свою учетную запись для доступа к личному кабинету и консультациям с юристами.
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]" noValidate>
          {/* Email поле */}
          <div className="flex flex-col gap-[8px]">
            {errors.common && (
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                {errors.common}
              </p>
            )}
            <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
              Электронная почта: *
            </label>
            <div className="relative h-[60px] rounded-[16px]">
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors({ ...errors, email: "" });
                  }
                }}
                placeholder="example@example.com"
                className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                  errors.email 
                    ? "border-red-400 focus:border-red-500" 
                    : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                } focus:outline-none transition-colors`}
              />
            </div>
            {errors.email && (
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                {errors.email}
              </p>
            )}
          </div>

          {/* Пароль поле */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
              Пароль: *
            </label>
            <div className="relative h-[60px] rounded-[16px]">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: "" });
                  }
                }}
                placeholder="Введите пароль"
                className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                  errors.password 
                    ? "border-red-400 focus:border-red-500" 
                    : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                } focus:outline-none transition-colors`}
              />
            </div>
            {errors.password && (
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                {errors.password}
              </p>
            )}
          </div>

          {/* Кнопка входа */}
          <button
            type="submit"
            className="bg-[#87b7ce] h-[60px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white mt-[8px] hover:bg-[#6fa2b8] transition-colors"
          >
            Войти
          </button>

          {/* Дополнительные ссылки */}
          <div className="flex flex-col gap-[12px] mt-[12px]">
            <button
              type="button"
              onClick={onSwitchToReset}
              className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.9)] text-center transition-colors"
            >
              Забыли пароль?
            </button>
            <div className="flex items-center justify-center gap-[8px]">
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.6)]">
                Нет аккаунта?
              </p>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>

          {/* Примечание о конфиденциальности */}
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] text-[12px] text-[rgba(255,255,255,0.6)] text-center mt-[8px]">
            Нажимая кнопку «Войти», я принимаю условия Пользовательского соглашения и условия Политики конфиденциальности.
          </p>
        </form>
      </div>
    </div>
  );
}