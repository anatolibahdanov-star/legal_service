"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";
import { validateResetPasswordForm } from "@/src/app/components/forms/validation/forgot";
import { submitResetPasswordFormAction } from "@/src/app/components/forms/action/forgot";
import { ResetPasswordFormI, FormProps } from "@/src/interfaces/form";
import { YandexSmartCaptcha } from "@/src/app/components/forms/YandexSmartCaptcha";
import { maskEmail } from "@/src/helpers/maskEmail";

interface ForgotEmailFormProps extends FormProps {
  /** Notifies parent popup to hide its own header during success state. */
  onHeaderlessChange?: (headerless: boolean) => void;
}

const FIELD_BG = "bg-[#f7f6f9] border border-[rgba(18,22,27,0.1)]";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotEmailForm({ onSwitchToLogin, onHeaderlessChange }: ForgotEmailFormProps) {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState({ email: "", common: "" });
  const [submitting, setSubmitting] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);
  const canSubmit = emailValid && !!captchaToken && !submitting;

  // Reflect the success-state takeover back to the popup so it can hide its
  // own header/tabs and avoid duplicating headings.
  useEffect(() => {
    onHeaderlessChange?.(maskedEmail !== null);
  }, [maskedEmail, onHeaderlessChange]);

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
      const next = { email: "", common: "Вы ввели некорректные данные." };
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
    const data2 = response.data as { maskedEmail?: string } | null;
    setMaskedEmail(data2?.maskedEmail ?? maskEmail(email));
  };

  if (maskedEmail) {
    return (
      <div className="flex flex-col items-center text-center gap-[16px] py-[8px]">
        <div className="w-[72px] h-[72px] rounded-full bg-[#34347c]/10 flex items-center justify-center">
          <MailCheck className="w-9 h-9 text-[#34347c]" strokeWidth={2} />
        </div>
        <h1 className="font-bold text-[26px] leading-[32px] text-[#12161b]">
          Проверьте почту
        </h1>
        <p className="text-[14px] leading-[22px] text-[rgba(18,22,27,0.6)]">
          Новый временный пароль отправлен на адрес{" "}
          <span className="text-[#12161b] font-semibold tracking-[0.4px]">{maskedEmail}</span>.
        </p>
        <p className="text-[13px] leading-[20px] text-[rgba(18,22,27,0.6)]">
          Войдите с этим паролем — он станет постоянным после первого успешного входа.
        </p>
        <button
          type="button"
          onClick={() => onSwitchToLogin()}
          className="bg-[radial-gradient(circle_at_50%_0%,#34347c_0%,#2d2d6c_100%)] hover:opacity-90 h-[52px] w-full rounded-[35px] font-semibold text-[15px] text-white mt-[8px] flex items-center justify-center gap-[8px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к входу
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]" noValidate>
      {errors.common && (
        <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
          <div>
            <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
              Не удалось получить пароль
            </p>
            <p className="text-[13px] text-red-600 leading-[18px]">{errors.common}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-[8px]">
        <label className="font-semibold text-[14px] text-[#12161b]">Email</label>
        <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
          <Mail className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#12161b]/60" />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="email"
            className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#12161b] placeholder:text-[#12161b]/40 rounded-[14px] outline-none ring-2 ${
              errors.email ? "ring-red-400" : "ring-transparent focus:ring-[#34347c]/35"
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
        className={`h-[52px] rounded-[35px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
          canSubmit
            ? "bg-[radial-gradient(circle_at_50%_0%,#34347c_0%,#2d2d6c_100%)] text-white hover:opacity-90"
            : "bg-[#e8e7ed] text-[#12161b]/50 cursor-not-allowed"
        }`}
      >
        {submitting ? "Отправляем…" : "Получить новый пароль"}
        {!submitting && <ArrowRight className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={() => onSwitchToLogin()}
        className="text-[14px] font-semibold text-[#12161b]/70 hover:text-[#12161b] transition-colors flex items-center justify-center gap-[6px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Вернуться ко входу
      </button>
    </form>
  );
}
