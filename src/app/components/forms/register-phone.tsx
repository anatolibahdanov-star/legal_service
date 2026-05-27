"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Phone } from "lucide-react";
import { FormContainerProps } from "@/src/interfaces/form";
import {
  sendPhoneOtpAction,
  verifyPhoneOtpAction,
  signInWithPhoneOtp,
} from "@/src/app/components/forms/action/register-phone";
import { PHONE_MASK_TEMPLATE, formatPhoneInput, isPhoneComplete } from "@/src/libs/phoneMask";
import { YandexSmartCaptcha } from "@/src/app/components/forms/YandexSmartCaptcha";
import { useYandexInvisibleCaptcha } from "@/src/app/components/forms/useYandexInvisibleCaptcha";
import OtpCodeStep, { OtpStepResult } from "@/src/app/components/forms/OtpCodeStep";
import {
  LegalConsents,
  emptyLegalConsents,
  allConsentsAccepted,
  type LegalConsentsValue,
} from "@/src/app/components/LegalConsents";
import { usePhoneBlockCountdown } from "@/src/app/components/forms/hooks/usePhoneBlockCountdown";

type Step = "phone" | "code";

const FIELD_BG = "bg-[#EFE7D8]";

export default function RegisterPhoneForm({ onClose, onSwitchToLogin }: FormContainerProps) {
  const router = useRouter();
  const { execute: executeCaptcha } = useYandexInvisibleCaptcha();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [normalizedPhone, setNormalizedPhone] = useState<string>("");
  const [errors, setErrors] = useState<{ phone: string; common: string }>({
    phone: "",
    common: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [consents, setConsents] = useState<LegalConsentsValue>(emptyLegalConsents);
  const [consentErrors, setConsentErrors] = useState<Partial<Record<keyof LegalConsentsValue, string>>>({});
  const block = usePhoneBlockCountdown();

  const phoneValid = useMemo(() => isPhoneComplete(phone), [phone]);
  const consentsOk = allConsentsAccepted(consents);
  const canSubmitPhone = phoneValid && !!captchaToken && consentsOk && !submitting && !block.blocked;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentsOk) {
      const next: Partial<Record<keyof LegalConsentsValue, string>> = {};
      if (!consents.privacy) next.privacy = "Подтвердите согласие.";
      if (!consents.data) next.data = "Подтвердите согласие.";
      if (!consents.offer) next.offer = "Подтвердите согласие.";
      setConsentErrors(next);
      return;
    }
    if (!canSubmitPhone) return;
    setErrors({ phone: "", common: "" });
    setSubmitting(true);
    const response = await sendPhoneOtpAction({ phone, captchaToken: captchaToken ?? "" });
    setSubmitting(false);
    setCaptchaToken(null);
    if (!response.status) {
      const errData = response.data as
        | { code?: string; phone?: string; lockedUntil?: string | null; cooldownUntil?: string | null }
        | null;
      if (errData?.code === "phone_exists") {
        // Per BPMN: "Phone exists?" → Yes → switch to login flow
        onSwitchToLogin({ phone: errData.phone ?? phone });
        return;
      }
      // If the server returned a deadline (lockedUntil / cooldownUntil),
      // feed it into the countdown so the UI shows MM:SS instead of
      // raw server text. The error banner falls back to the plain message
      // when no deadline is present.
      block.applyFromServer(errData);
      setErrors((prev) => ({ ...prev, common: response.error || "Не удалось отправить код." }));
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
      const response = await sendPhoneOtpAction({
        phone: targetPhone,
        captchaToken: token,
      });
      if (!response.status) {
        const errData = response.data as
          | { code?: string; cooldownUntil?: string | null; lockedUntil?: string | null; phone?: string }
          | null;
        if (errData?.code === "phone_exists") {
          // on resend got "phone already registered" — switch to login flow
          onSwitchToLogin({ phone: errData.phone ?? targetPhone });
          return { ok: true };
        }
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
  }, [executeCaptcha, normalizedPhone, phone, onSwitchToLogin]);

  const handleVerify = async (otpCode: string): Promise<OtpStepResult> => {
    const response = await verifyPhoneOtpAction({ phone: normalizedPhone, code: otpCode });
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
    const data = response.data as { phone: string; verifyToken: string };
    const signInResult = await signInWithPhoneOtp(data.phone, data.verifyToken);
    if (!signInResult.status) {
      return {
        ok: false,
        message: signInResult.error || "Ошибка авторизации. Попробуйте позже.",
      };
    }
    onClose();
    router.push("/profile");
    router.refresh();
    return { ok: true };
  };

  const goBackToPhoneStep = (): OtpStepResult => {
    setStep("phone");
    setErrors({ phone: "", common: "" });
    return { ok: true };
  };

  if (step === "code") {
    return (
      <OtpCodeStep
        phone={normalizedPhone}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangePhone={() => {
          goBackToPhoneStep();
        }}
      />
    );
  }

  return (
    <>
      <div className="mb-[24px] pr-[24px]">
        <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[10px]">
          Регистрация
        </h1>
        <p className="font-normal text-[14px] leading-[22px] text-[#6B7280]">
          Создайте учётную запись для доступа к консультациям юристов и личному кабинету.
        </p>
        <p className="font-normal text-[14px] leading-[22px] text-[#6B7280] mt-[6px]">
          Укажите номер телефона — отправим SMS-код для подтверждения.
        </p>
      </div>

      {step === "phone" && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-[18px]" noValidate>
          {errors.common && (
            <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
              <div>
                <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
                  {block.locked ? "Номер временно заблокирован" : "Не удалось зарегистрироваться"}
                </p>
                <p className="text-[13px] text-red-600 leading-[18px]">{errors.common}</p>
                {block.blocked && (
                  <p className="text-[13px] text-red-600 leading-[18px] mt-[4px]">
                    Попробуйте через{" "}
                    <span className="font-semibold tabular-nums">{block.remainingLabel}</span>
                  </p>
                )}
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
                  // Clearing the input switches to a different phone — the previous
                  // server-issued block is per-phone, so we drop it locally.
                  block.reset();
                }}
                placeholder={PHONE_MASK_TEMPLATE}
                className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                  errors.phone ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
                } transition-all`}
              />
            </div>
            {errors.phone && (
              <p className="text-[12px] text-red-500 ml-[4px]">{errors.phone}</p>
            )}
          </div>

          <YandexSmartCaptcha
            token={captchaToken}
            onChange={setCaptchaToken}
            disabled={submitting}
            fullWidth
          />

          <LegalConsents
            value={consents}
            onChange={(next) => {
              setConsents(next);
              setConsentErrors({});
            }}
            errors={consentErrors}
            idPrefix="register-consent"
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
            {submitting ? "Отправляем…" : "Далее"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="flex items-center justify-center gap-[6px]">
            <p className="text-[14px] text-[#6B7280]">Уже есть аккаунт?</p>
            <button
              type="button"
              onClick={() => onSwitchToLogin()}
              className="text-[14px] font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
            >
              Войти
            </button>
          </div>
        </form>
      )}

    </>
  );
}
