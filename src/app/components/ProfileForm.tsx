'use client'; 
import { useState } from "react";
import { useSession, getSession } from "next-auth/react"
import { redirect } from 'next/navigation';
import { AuthForm } from "@/src/app/components/AuthForm";
import { RegisterForm } from "@/src/app/components/RegisterForm";
import { ResetPasswordForm } from "@/src/app/components/ResetPasswordForm";
import { UserSettingsForm } from "@/src/app/components/UserSettingsForm";
import { RequestHistoryForm } from "@/src/app/components/RequestHistoryForm";

export default function ProfileForm() {
  // const [activeForm, setActiveForm] = useState<"login" | "register" | "reset" | "settings" | "history" | null>(null);

  // return (
  //   <main className="flex-1 w-full max-w-[1216px] mx-auto px-[159px] py-[48px]">
  //     <div className="size-full relative">

  //       {/* Кнопки в правом верхнем углу */}
  //       {/* <div className="top-8 right-8 flex gap-4">
  //         <button
  //           onClick={() => setActiveForm("history")}
  //           className="bg-[#2d3b4e] h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#1d2b3e] transition-colors shadow-lg"
  //         >
  //           История
  //         </button>
  //         <button
  //           onClick={() => setActiveForm("settings")}
  //           className="bg-[#3d4b5e] h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#2d3b4e] transition-colors shadow-lg"
  //         >
  //           Настройки
  //         </button>
  //         <button
  //           onClick={() => setActiveForm("login")}
  //           className="bg-[#87b7ce] h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#6fa2b8] transition-colors shadow-lg"
  //         >
  //           Войти
  //         </button>
  //       </div> */}


        
        
  //     </div>
  //   </main>
    
  // );

  const { data: session, update } = useSession()
  if(!session || !session?.user) {
    redirect('/')
  }
  const user = session.user
  const [name, setName] = useState(user.name ?? '');
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ name: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  

  

  const validateForm = () => {
    const newErrors = { name: "", currentPassword: "", newPassword: "", confirmPassword: "" };
    let isValid = true;

    // Валидация имени
    if (!name.trim()) {
      newErrors.name = "Пожалуйста, введите ваше имя";
      isValid = false;
    }

    // Валидация пароля (только если пользователь хочет его изменить)
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = "Введите текущий пароль";
        isValid = false;
      }

      if (!newPassword) {
        newErrors.newPassword = "Пожалуйста, введите новый пароль";
        isValid = false;
      } else if (newPassword.length < 6) {
        newErrors.newPassword = "Пароль должен содержать минимум 6 символов";
        isValid = false;
      }

      // Валидация подтверждения пароля
      if (!confirmPassword) {
        newErrors.confirmPassword = "Пожалуйста, подтвердите новый пароль";
        isValid = false;
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Пароли не совпадают";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log("Обновление настроек:", { 
        name, 
        passwordChanged: !!newPassword 
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
      }, 2000);
      // Здесь будет логика обновления данных пользователя
    }
  };

  return (
    <div className="bg-[#3d4b5e] rounded-[24px] p-[40px] mb-[32px]">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[24px]">
            Учетная запись
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-[32px]" noValidate>
            {/* Левая колонка - персональные данные */}
            <div className="flex flex-col gap-[16px]">
            <h3 className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[18px] text-[rgba(255,255,255,0.9)] mb-[8px]">
                Персональные данные
            </h3>

            {/* Имя поле */}
            <div className="flex flex-col gap-[8px]">
                <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                Ваше имя: *
                </label>
                <div className="relative h-[60px] rounded-[16px]">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                        setErrors({ ...errors, name: "" });
                    }
                    }}
                    placeholder="Имя"
                    className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                    errors.name 
                        ? "border-red-400 focus:border-red-500" 
                        : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                    } focus:outline-none transition-colors`}
                />
                </div>
                {errors.name && (
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                    {errors.name}
                </p>
                )}
            </div>

            {/* Email поле (только для отображения) */}
            <div className="flex flex-col gap-[8px]">
                <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                Электронная почта:
                </label>
                <div className="relative h-[60px] rounded-[16px]">
                <input
                    type="text"
                    value={user.email ?? ''}
                    disabled
                    className="w-full h-full px-[20px] py-[16px] bg-[rgba(255,255,255,0.05)] font-['Inter:Regular',sans-serif] font-normal text-[16px] text-[rgba(255,255,255,0.5)] cursor-not-allowed rounded-[16px] border-2 border-[rgba(255,255,255,0.1)]"
                />
                </div>
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.5)] ml-[4px]">
                Email нельзя изменить
                </p>
            </div>
            </div>

            {/* Правая колонка - изменение пароля */}
            <div className="flex flex-col gap-[16px]">
            <h3 className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[18px] text-[rgba(255,255,255,0.9)] mb-[8px]">
                Изменение пароля
            </h3>

            {/* Текущий пароль */}
            <div className="flex flex-col gap-[8px]">
                <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                Текущий пароль:
                </label>
                <div className="relative h-[60px] rounded-[16px]">
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.currentPassword) {
                        setErrors({ ...errors, currentPassword: "" });
                    }
                    }}
                    placeholder="Введите текущий пароль"
                    className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                    errors.currentPassword 
                        ? "border-red-400 focus:border-red-500" 
                        : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                    } focus:outline-none transition-colors`}
                />
                </div>
                {errors.currentPassword && (
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                    {errors.currentPassword}
                </p>
                )}
            </div>

            {/* Новый пароль поле */}
            <div className="flex flex-col gap-[8px]">
                <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                Новый пароль:
                </label>
                <div className="relative h-[60px] rounded-[16px]">
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                        setErrors({ ...errors, newPassword: "" });
                    }
                    }}
                    placeholder="Минимум 6 символов"
                    className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                    errors.newPassword 
                        ? "border-red-400 focus:border-red-500" 
                        : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                    } focus:outline-none transition-colors`}
                />
                </div>
                {errors.newPassword && (
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                    {errors.newPassword}
                </p>
                )}
            </div>

            {/* Подтверждение нового пароля поле */}
            <div className="flex flex-col gap-[8px]">
                <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                Подтверждение пароля:
                </label>
                <div className="relative h-[60px] rounded-[16px]">
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: "" });
                    }
                    }}
                    placeholder="Повторите новый пароль"
                    className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                    errors.confirmPassword 
                        ? "border-red-400 focus:border-red-500" 
                        : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                    } focus:outline-none transition-colors`}
                />
                </div>
                {errors.confirmPassword && (
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                    {errors.confirmPassword}
                </p>
                )}
            </div>
            </div>

            {/* Кнопки */}
            <div className="col-span-2 flex gap-[16px] justify-end mt-[8px]">
            <button
                type="submit"
                disabled={isSubmitted}
                className={`h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white transition-colors ${
                isSubmitted 
                    ? "bg-[#4ade80] cursor-not-allowed" 
                    : "bg-[#87b7ce] hover:bg-[#6fa2b8]"
                }`}
            >
                {isSubmitted ? "Сохранено ✓" : "Сохранить изменения"}
            </button>
            </div>
        </form>
    </div>
  );
}