"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, MessageSquare, Phone, ShieldCheck } from "lucide-react";
import { FormProps } from "@/src/interfaces/form";
import {
  sendResetPhoneOtpAction,
  verifyResetPhoneOtpAction,
} from "@/src/app/components/forms/action/reset-phone";
import { PHONE_MASK_TEMPLATE, formatPhoneInput, isPhoneComplete } from "@/src/libs/phoneMask";
import { YandexSmartCaptcha } from "@/src/app/components/forms/YandexSmartCaptcha";
import { useYandexInvisibleCaptcha } from "@/src/app/components/forms/useYandexInvisibleCaptcha";
import OtpCodeStep, { OtpStepResult } from "@/src/app/components/forms/OtpCodeStep";

type Step = "phone" | "code" | "success";

interface ForgotPhoneFormProps extends FormProps {
  /** Notifies parent popup to hide its own header during OTP/success state. */
  onHeaderlessChange?: (headerless: boolean) => void;
}

const FIELD_BG = "bg-[#EFE7D8]";

export default function ForgotPhoneForm({ onSwitchToLogin, onHeaderlessChange }: ForgotPhoneFormProps) {
  const { execute: executeCaptcha } = useYandexInvisibleCaptcha();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [normalizedPhone, setNormalizedPhone] = useState<string>("");
  const [maskedPhone, setMaskedPhone] = useState<string>("");
  const [errors, setErrors] = useState<{ phone: string; common: string }>({
    phone: "",
    common: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const phoneValid = useMemo(() => isPhoneComplete(phone), [phone]);
  const canSubmitPhone = phoneValid && !!captchaToken && !submitting;

  // OTP and success steps render their own self-contained heading; tell the
  // popup to hide its header in those stages so we don't show two titles.
  useEffect(() => {
    onHeaderlessChange?.(step !== "phone");
  }, [step, onHeaderlessChange]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPhone) return;
    setErrors({ phone: "", common: "" });
    setSubmitting(true);
    const response = await sendResetPhoneOtpAction({
      phone,
      captchaToken: captchaToken ?? "",
    });
    setSubmitting(false);
    setCaptchaToken(null);
    if (!response.status) {
      setErrors((prev) => ({
        ...prev,
        common: response.error || "Не удалось отправить код.",
      }));
      return;
    }
    const data = response.data as { phone: string; expiresInSec: number; devCode?: string };
    setNormalizedPhone(data.phone);
    if (data.devCode) console.info("[DEV] OTP code:", data.devCode);
    setStep("code");
  };

  const handleResend = useCallback(async (): Promise<OtpStepResult> => {
    const targetPhone = normalizedPhone || phone;
    if (!targetPhone) {
      return { ok: false, message: "Не удалось определить номер телефона." };
    }
    try {
      const token = await executeCaptcha();
      const response = await sendResetPhoneOtpAction({
        phone: targetPhone,
        captchaToken: token,
      });
      if (!response.status) {
        const errData = response.data as
          | { cooldownUntil?: string | null; lockedUntil?: string | null }
          | null;
        return {
          ok: false,
          message: response.error,
          cooldownUntil: errData?.cooldownUntil ?? null,
          lockedUntil: errData?.lockedUntil ?? null,
        };
      }
      const data = response.data as { phone: string; expiresInSec: number; devCode?: string };
      setNormalizedPhone(data.phone);
      if (data.devCode) console.info("[DEV] OTP code:", data.devCode);
      return { ok: true };
    } catch {
      return { ok: false, message: "Не удалось отправить код. Попробуйте позже." };
    }
  }, [executeCaptcha, normalizedPhone, phone]);

  const handleVerify = async (otpCode: string): Promise<OtpStepResult> => {
    const response = await verifyResetPhoneOtpAction({
      phone: normalizedPhone,
      code: otpCode,
    });
    if (!response.status) {
      const errData = response.data as
        | { cooldownUntil?: string | null; lockedUntil?: string | null; attemptsLeft?: number | null }
        | null;
      return {
        ok: false,
        message: response.error,
        cooldownUntil: errData?.cooldownUntil ?? null,
        lockedUntil: errData?.lockedUntil ?? null,
        attemptsLeft: errData?.attemptsLeft ?? null,
      };
    }
    const data = response.data as { phone: string; maskedPhone: string };
    setMaskedPhone(data.maskedPhone || data.phone);
    setStep("success");
    return { ok: true };
  };

  const goBackToPhoneStep = () => {
    setStep("phone");
    setErrors({ phone: "", common: "" });
  };

  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-[16px] py-[8px]">
        <div className="w-[72px] h-[72px] rounded-full bg-[#5A8FB5]/15 flex items-center justify-center">
          <MessageSquare className="w-9 h-9 text-[#5A8FB5]" strokeWidth={2} />
        </div>
        <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D]">
          Проверьте SMS
        </h1>
        <p className="text-[14px] leading-[22px] text-[#6B7280]">
          Новый временный пароль отправлен на номер{" "}
          <span className="text-[#0F1B2D] font-semibold tracking-[0.4px]">{maskedPhone}</span>.
        </p>
        <p className="text-[13px] leading-[20px] text-[#6B7280]">
          Войдите с этим паролем — он станет постоянным после первого успешного входа.
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

  if (step === "code") {
    return (
      <OtpCodeStep
        phone={normalizedPhone}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangePhone={goBackToPhoneStep}
        initialResendCooldown={24 * 60 * 60}
      />
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="flex flex-col gap-[18px]" noValidate>
      {errors.common && (
        <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
          <div>
            <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
              Не удалось отправить код
            </p>
            <p className="text-[13px] text-red-600 leading-[18px]">{errors.common}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-[8px]">
        <label className="font-semibold text-[14px] text-[#0F1B2D]">Номер телефона</label>
        <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
          <Phone className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              const formatted = formatPhoneInput(e.target.value);
              setPhone(formatted);
              setErrors((prev) => ({
                ...prev,
                phone:
                  !formatted || isPhoneComplete(formatted)
                    ? ""
                    : "Введите корректный номер телефона",
                common: "",
              }));
            }}
            placeholder={PHONE_MASK_TEMPLATE}
            className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
              errors.phone ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
            } transition-all`}
          />
        </div>
        {errors.phone ? (
          <p className="text-[12px] text-red-500 ml-[4px]">{errors.phone}</p>
        ) : (
          <p className="text-[12px] text-[#6B7280] ml-[4px]">Отправим SMS с кодом подтверждения</p>
        )}
      </div>

      <YandexSmartCaptcha
        token={captchaToken}
        onChange={setCaptchaToken}
        disabled={submitting}
        fullWidth
      />

      <button
        type="submit"
        disabled={!canSubmitPhone}
        className={`h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
          canSubmitPhone
            ? "bg-[#5A8FB5] text-white hover:bg-[#4A7EA3]"
            : "bg-[#D6E3EF] text-[#0F1B2D]/50 cursor-not-allowed"
        }`}
      >
        {submitting ? "Отправляем…" : "Получить код"}
        {!submitting && <ArrowRight className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={() => onSwitchToLogin()}
        className="text-[14px] font-semibold text-[#0F1B2D]/70 hover:text-[#0F1B2D] transition-colors flex items-center justify-center gap-[6px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Вернуться ко входу
      </button>

      <div className="mt-[4px] px-[14px] py-[12px] rounded-[12px] bg-[#EFE7D8]/40 border border-[#EFE7D8] flex items-start gap-[10px]">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-[2px]" />
        <p className="text-[13px] leading-[18px] text-[#6B7280]">
          В целях безопасности мы не сообщаем, существует ли указанный номер в системе.
        </p>
      </div>
    </form>
  );
}
