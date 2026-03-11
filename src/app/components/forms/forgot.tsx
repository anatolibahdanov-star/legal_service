import { useState } from "react";
import { validateResetPasswordForm } from "@/src/app/components/forms/validation/forgot";
import { submitResetPasswordFormAction } from "@/src/app/components/forms/action/forgot";
import { ResetPasswordFormI, FormProps } from "@/src/interfaces/form";

export default function ForgotPasswordForm({ onSwitchToLogin }: FormProps) {
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({ email: "", common: "" });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data: ResetPasswordFormI = {email: email}
        
        const validResult = validateResetPasswordForm(data)
        if (validResult.is_success) {
            console.log("Password recovery", email);
            setIsSubmitted(true);
            setTimeout(() => {setIsSubmitted(false);}, 2000);

            const isSuccess = await submitResetPasswordFormAction(email)
            if(!isSuccess) {
                const newErrors = { email: "", common: "" };
                newErrors.common = "Произошла техническая ошибка. Попробуйте авторизироваться еще раз.";
                setErrors(newErrors);
                return false
            }
        } else {
            const _errors = validResult.errors
            if(_errors !== null) {
                const newErrors = { email: "", common: "" };
                newErrors.common = "Вы ввели не корректные данные.";
                newErrors.email = _errors[0].error.join('<br />');;
                setErrors(newErrors);
            }
        }
    };

    return (
        <>
        {/* Заголовок */}
            <div className="mb-[32px]">
                <h1 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[12px]">
                    Восстановление пароля
                </h1>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[22.75px] text-[14px] text-[rgba(255,255,255,0.8)]">
                    {isSubmitted 
                    ? "Инструкции по восстановлению пароля отправлены на вашу электронную почту."
                    : "Введите адрес электронной почты, и мы отправим вам инструкции по восстановлению пароля."
                    }
                </p>
                {errors.common && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                        {errors.common}
                    </p>
                )}
            </div>

            {!isSubmitted ? (
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

                    {/* Кнопка отправки */}
                    <button
                        type="submit"
                        className="bg-[#87b7ce] h-[60px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white mt-[8px] hover:bg-[#6fa2b8] transition-colors"
                    >Отправить инструкции</button>

                    {/* Ссылка на вход */}
                    <div className="flex items-center justify-center gap-[8px] mt-[12px]">
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.6)]">Вспомнили пароль?</p>
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors"
                        >Войти</button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col gap-[16px]">
                    {/* Иконка успеха */}
                    <div className="flex justify-center mb-[8px]">
                    <div className="bg-[#4ade80]/20 rounded-full p-[16px]">
                        <svg className="w-12 h-12 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    </div>

                    {/* Кнопка возврата к входу */}
                    <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="bg-[#87b7ce] h-[60px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#6fa2b8] transition-colors"
                    >Вернуться к входу</button>
                </div>
            )}
        </>
    )
}