import { useState } from "react";
import { useSession, getSession } from "next-auth/react"
import { validateRegisterForm } from "@/src/app/components/forms/validation/register";
import { submitRegisterFormAction } from "@/src/app/components/forms/action/register";
import { RegisterFormI, FormContainerProps } from "@/src/interfaces/form";
import { redirect } from 'next/navigation';

export default function RegisterForm({ onClose, onSwitchToLogin }: FormContainerProps) {
    const { data: session, update } = useSession()
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({ name: "", email: "", password: "", confirmPassword: "", common: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data: RegisterFormI = {email: email, name: name, password: password, confirmPassword: confirmPassword}
        
        const validResult = validateRegisterForm(data)
        if (validResult.is_success) {
            console.log("Registration ", email);

            const registerData = await submitRegisterFormAction(data)
            if(!registerData.status) {
                const newErrors = { name: "", email: "", password: "", confirmPassword: "", common: "" };
                newErrors.common = registerData.error;
                setErrors(newErrors);
                return false
            }

            await update(); 

            const session = await getSession();
            const user = session?.user
            if(user === null) {
                const newErrors = { name: "", email: "", password: "", confirmPassword: "", common: "" };
                newErrors.common = "Произошла техническая ошибка(2). Попробуйте зарегистрироватьс еще раз.";
                setErrors(newErrors);
                return false
            }

            console.log('handleSubmit user', user)
            onClose()
            redirect('/profile');
        } else {
            const _errors = validResult.errors
            if(_errors !== null) {
                const newErrors = { name: "", email: "", password: "", confirmPassword: "", common: "" };
                newErrors.common = "Вы ввели не корректные данные.";
                for (const error of _errors) {
                    switch(error.field) {
                        case "name":
                            newErrors.name = error.error.join('<br />');
                            break;
                        case "email":
                            newErrors.email = error.error.join('<br />');
                            break;
                        case "password":
                            newErrors.password = error.error.join('<br />');
                            break;
                        case "confirmPassword":
                            newErrors.confirmPassword = error.error.join('<br />');
                            break;
                    }
                }
                
                setErrors(newErrors);
            }
        }
    };

    return (
        <>
            {/* Заголовок */}
            <div className="mb-[32px]">
                <h1 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[12px]">
                    Регистрация
                </h1>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[22.75px] text-[14px] text-[rgba(255,255,255,0.8)]">
                    Создайте учетную запись для доступа к консультациям юристов и личному кабинету.
                </p>
                {errors.common && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                        {errors.common}
                    </p>
                )}
            </div>

            {/* Форма */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]" noValidate>
            
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
                        placeholder="Минимум 6 символов"
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

                {/* Подтверждение пароля поле */}
                <div className="flex flex-col gap-[8px]">
                    <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                    Подтверждение пароля: *
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
                        placeholder="Повторите пароль"
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

                {/* Кнопка регистрации */}
                <button
                    type="submit"
                    className="bg-[#87b7ce] h-[60px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white mt-[8px] hover:bg-[#6fa2b8] transition-colors"
                >
                    Зарегистрироваться
                </button>

                {/* Ссылка на вход */}
                <div className="flex items-center justify-center gap-[8px] mt-[12px]">
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.6)]">
                    Уже есть аккаунт?
                    </p>
                    <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors"
                    >
                    Войти
                    </button>
                </div>

                {/* Примечание о конфиденциальности */}
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] text-[12px] text-[rgba(255,255,255,0.6)] text-center mt-[8px]">
                    Нажимая кнопку «Зарегистрироваться», я принимаю условия Пользовательского соглашения и условия Политики конфиденциальности.
                </p>
            </form>
        </>
    )
}