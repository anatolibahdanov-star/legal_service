'use client'; 
import { useState } from "react";
import { useSession } from "next-auth/react"
import { redirect } from 'next/navigation';
import { validateProfileForm } from "@/src/app/components/forms/validation/profile";
import { submitProfileFormAction } from "@/src/app/components/forms/action/profile";
import { ProfileFormI } from "@/src/interfaces/form";

export default function ProfileForm() {
    const { data: session, update } = useSession()
    if(!session || !session?.user) {
        redirect('/')
    }
    const user = session.user
    const [name, setName] = useState(user.name ?? '');
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({ common: "", name: "", currentPassword: "", newPassword: "", confirmPassword: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data: ProfileFormI = {name: name, oldPassword: currentPassword, password: newPassword, confirmPassword: confirmPassword}
        const newErrors = { name: "", currentPassword: "", newPassword: "", confirmPassword: "", common: "" };

        const validResult = validateProfileForm(data)
        if (validResult.is_success) {
            console.log("Обновление настроек:", {name, passwordChanged: !!newPassword});
            
            const sessionUser = session.user
            const profileData = await submitProfileFormAction(data, sessionUser)
            if(!profileData.status) {
                newErrors.common = profileData.error;
                setErrors(newErrors);
                return false
            }

            await update();
            setName(sessionUser.name ?? "")
            setNewPassword("")
            setConfirmPassword("")
            setCurrentPassword("")
        } else {
            const _errors = validResult.errors
            if(_errors !== null) {
                newErrors.common = "Вы ввели не корректные данные.";
                for (const error of _errors) {
                    switch(error.field) {
                        case "name":
                            newErrors.name = error.error.join('<br />');
                            break;
                        case "oldPassword":
                            newErrors.currentPassword = error.error.join('<br />');
                            break;
                        case "password":
                            newErrors.newPassword = error.error.join('<br />');
                            break;
                        case "confirmPassword":
                            newErrors.confirmPassword = error.error.join('<br />');
                            break;
                    }
                }
                
                setErrors(newErrors);
            }
            return false
        }
    };

  return (
    <div className="bg-[#3d4b5e] rounded-[24px] p-[40px] mb-[32px]">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[24px]">
            Учетная запись
        </h2>
        {errors.common && (
            <p className="font-['Inter:Regular',sans-serif] font-big text-[12px] text-red-400 ml-[4px]">
                {errors.common}
            </p>
        )}
        
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
                    className={`h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white transition-colors bg-[#87b7ce] hover:bg-[#6fa2b8]`}
                >
                    Сохранить изменения
                </button>
            </div>
        </form>
    </div>
  );
}