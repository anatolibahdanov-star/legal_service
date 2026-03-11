import { useState } from "react";
import { useSession, getSession } from "next-auth/react"
import { redirect } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { validateAuthForm } from "@/src/app/components/forms/validation/auth";
import { AuthFormPropsI, AuthFormI } from "@/src/interfaces/form";

export default function AuthForm({ onClose, onSwitchToRegister, onSwitchToReset }: AuthFormPropsI) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "", common: "" });
    const { data: session, update } = useSession()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data: AuthFormI = {email: email, password: password}
        
        const validResult = validateAuthForm(data)
        if (validResult.is_success) {
            console.log("Вход:", { email, password });
            const credentials = {username: email, password: password}
            const newErrors = { email: "", password: "", common: "" };
            const response = await signIn('credentials', {
                ...credentials,
                redirect: false,
            });
            if(response?.error) {
                console.error("Incorrect response", response?.error)
                newErrors.common = response?.error ? response.error : "Произошла техническая ошибка(1). Попробуйте авторизироваться еще раз.";
                setErrors(newErrors);
                return false
            }

            await update();
            const session = await getSession();
            const user = session?.user
            if(user === null) {
                console.error("Incorrect session creation")
                newErrors.common = "Произошла техническая ошибка(2). Попробуйте авторизироваться еще раз.";
                setErrors(newErrors);
                return false
            }

            console.log('handleSubmit user', user)
            onClose()
            if(user?.role !== "user") {
                redirect('/admin');
            } else {
                redirect('/profile');
            }
        }
    };
    return (
        <>
            {/* Заголовок */}
            <div className="mb-[32px]">
                <h1 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[12px]">
                    Вход в систему
                </h1>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[22.75px] text-[14px] text-[rgba(255,255,255,0.8)]">
                    Войдите в свою учетную запись для доступа к личному кабинету и консультациям с юристами.
                </p>
                {errors.common && (
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                    {errors.common}
                </p>
                )}
            </div>

            {/* Форма */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]" noValidate>
            {/* Email поле */}
            <div className="flex flex-col gap-[8px]">
                
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
        </>
    )
}