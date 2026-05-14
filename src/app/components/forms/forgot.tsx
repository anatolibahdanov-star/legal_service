"use client";
import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { validateResetPasswordForm } from "@/src/app/components/forms/validation/forgot";
import { submitResetPasswordFormAction } from "@/src/app/components/forms/action/forgot";
import { ResetPasswordFormI, FormProps } from "@/src/interfaces/form";
import { YandexSmartCaptcha } from "@/src/app/components/forms/YandexSmartCaptcha";
import { CaptchaDisclaimer } from "@/src/app/components/forms/CaptchaDisclaimer";

const FIELD_BG = "bg-[#EFE7D8]";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm({ onSwitchToLogin }: FormProps) {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState({ email: "", common: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);
  const canSubmit = emailValid && !!captchaToken && !submitting;

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: !value || EMAIL_REGEX.test(value) ? "" : "Некорректный формат email",
      common: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: ResetPasswordFormI = { email };

    const validResult = validateResetPasswordForm(data);
    if (!validResult.is_success) {
      const next = { email: "", common: "Вы ввели не корректные данные." };
      const fieldErr = validResult.errors?.[0];
      if (fieldErr) next.email = fieldErr.error.join(" ");
      setErrors(next);
      return;
    }

    setErrors({ email: "", common: "" });
    setSubmitting(true);
    const response = await submitResetPasswordFormAction(email, captchaToken ?? "");
    setSubmitting(false);
    setCaptchaToken(null);
    if (!response.status) {
      setErrors({
        email: "",
        common: response.error || "Произошла техническая ошибка. Попробуйте позже.",
      });
      return;
    }
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center text-center gap-[16px] py-[8px]">
        <div className="w-[64px] h-[64px] rounded-full bg-[#5A8FB5]/15 flex items-center justify-center">
          <Check className="w-8 h-8 text-[#5A8FB5]" strokeWidth={3} />
        </div>
        <h1 className="font-bold text-[24px] leading-[28px] text-[#0F1B2D]">
          Письмо отправлено
        </h1>
        <p className="text-[14px] text-[#6B7280]">
          Инструкции по восстановлению пароля отправлены на{" "}
          <span className="text-[#0F1B2D] font-medium">{email}</span>.
        </p>
        <button
          type="button"
          onClick={() => onSwitchToLogin()}
          className="bg-[#5A8FB5] hover:bg-[#4A7EA3] h-[52px] w-full rounded-[14px] font-semibold text-[15px] text-white mt-[8px] flex items-center justify-center gap-[8px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к входу
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-[24px] pr-[24px]">
        <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[10px]">
          Восстановление пароля
        </h1>
        <p className="font-normal text-[14px] leading-[22px] text-[#6B7280]">
          Введите адрес электронной почты, и мы отправим инструкции по восстановлению пароля.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]" noValidate>
        {errors.common && (
          <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
            <div>
              <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
                Не удалось отправить письмо
              </p>
              <p className="text-[13px] text-red-600 leading-[18px]">{errors.common}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-[8px]">
          <label className="font-semibold text-[14px] text-[#0F1B2D]">Email</label>
          <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
            <Mail className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@company.com"
              className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                errors.email ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
              } transition-all`}
            />
          </div>
          {errors.email && <p className="text-[12px] text-red-500 ml-[4px]">{errors.email}</p>}
        </div>

        <YandexSmartCaptcha
          token={captchaToken}
          onChange={setCaptchaToken}
          disabled={submitting}
          fullWidth
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
            canSubmit
              ? "bg-[#5A8FB5] text-white hover:bg-[#4A7EA3]"
              : "bg-[#D6E3EF] text-[#0F1B2D]/50 cursor-not-allowed"
          }`}
        >
          {submitting ? "Отправляем…" : "Отправить инструкции"}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>

        <CaptchaDisclaimer />

        <div className="flex items-center justify-center gap-[6px]">
          <p className="text-[14px] text-[#6B7280]">Вспомнили пароль?</p>
          <button
            type="button"
            onClick={() => onSwitchToLogin()}
            className="text-[14px] font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
          >
            Войти
          </button>
        </div>
      </form>
    </>
  );
}
