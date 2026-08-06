"use client";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { consumePostAuthRedirect } from "@/src/libs/postAuthIntent";

type Step = "phone" | "code";

const FIELD_BG = "bg-[#f7f6f9] border border-[rgba(18,22,27,0.1)]";

export default function RegisterPhoneForm({ onClose, onSwitchToLogin }: FormContainerProps) {
  const router = useRouter();
  const { execute: executeCaptcha } = useYandexInvisibleCaptcha();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [existingPhone, setExistingPhone] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [normalizedPhone, setNormalizedPhone] = useState<string>("");
  const [otpExpiresInSec, setOtpExpiresInSec] = useState<number>(0);
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
        setExistingPhone(errData.phone || phone);
        setErrors({ phone: "", common: "" });
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
    const data = response.data as {
      phone: string;
      expiresInSec: number;
      devCode?: string;
    };
    if (data.devCode) console.info("[DEV] OTP code:", data.devCode);
    setNormalizedPhone(data.phone);
    setOtpExpiresInSec(data.expiresInSec ?? 0);
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
          setExistingPhone(errData.phone || targetPhone);
          setStep("phone");
        }
        return {
          ok: false,
          message: response.error,
          cooldownUntil: errData?.cooldownUntil ?? null,
          lockedUntil: errData?.lockedUntil ?? null,
        };
      }
      const data = response.data as {
        phone: string;
        expiresInSec: number;
        devCode?: string;
      };
      if (data.devCode) console.info("[DEV] OTP code:", data.devCode);
      setNormalizedPhone(data.phone);
      return { ok: true, expiresInSec: data.expiresInSec };
    } catch {
      return { ok: false, message: "Не удалось отправить код. Попробуйте позже." };
    }
  }, [executeCaptcha, normalizedPhone, phone]);

  const handleVerify = async (otpCode: string): Promise<OtpStepResult> => {
    const response = await verifyPhoneOtpAction({ phone: normalizedPhone, code: otpCode });
    if (!response.status) {
      const errData = response.data as
        | {
            code?: string;
            phone?: string;
            cooldownUntil?: string | null;
            lockedUntil?: string | null;
            attemptsLeft?: number | null;
          }
        | null;
      if (errData?.code === "phone_exists") {
        setExistingPhone(errData.phone || normalizedPhone);
        setStep("phone");
      }
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
    router.push(consumePostAuthRedirect() ?? "/profile");
    router.refresh();
    return { ok: true };
  };

  const goBackToPhoneStep = (): OtpStepResult => {
    setStep("phone");
    setErrors({ phone: "", common: "" });
    return { ok: true };
  };

  const chooseAnotherPhone = () => {
    setPhone("");
    setNormalizedPhone("");
    setExistingPhone("");
    setErrors({ phone: "", common: "" });
    block.reset();
    window.requestAnimationFrame(() => phoneInputRef.current?.focus());
  };

  if (step === "code") {
    return (
      <OtpCodeStep
        phone={normalizedPhone}
        initialExpiresInSec={otpExpiresInSec}
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

          {existingPhone && (
            <div className="px-[16px] py-[14px] rounded-[12px] bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-[10px]">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-px" />
                <div>
                  <p className="font-semibold text-[14px] text-amber-800 leading-[18px]">
                    Номер уже зарегистрирован
                  </p>
                  <p className="text-[13px] text-amber-700 leading-[18px] mt-[2px]">
                    Аккаунт с таким номером уже есть. Войдите или укажите другой номер.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-[8px] mt-[12px]">
                <button
                  type="button"
                  onClick={() => onSwitchToLogin({ phone: existingPhone })}
                  className="h-[38px] px-[18px] rounded-full bg-[#34347c] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                >
                  Войти
                </button>
                <button
                  type="button"
                  onClick={chooseAnotherPhone}
                  className="h-[38px] px-[18px] rounded-full border border-amber-300 text-amber-800 text-[13px] font-semibold hover:bg-amber-100 transition-colors"
                >
                  Указать другой номер
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-[8px]">
            <label className="font-semibold text-[14px] text-[#12161b]">Номер телефона</label>
            <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
              <Phone className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#12161b]/60" />
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  const formatted = formatPhoneInput(e.target.value);
                  setPhone(formatted);
                  setExistingPhone("");
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
                className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#12161b] placeholder:text-[#12161b]/40 rounded-[14px] outline-none ring-2 ${
                  errors.phone ? "ring-red-400" : "ring-transparent focus:ring-[#34347c]/35"
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

          <button
            type="submit"
            disabled={!canSubmitPhone}
            className={`h-[52px] rounded-[35px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
              canSubmitPhone
                ? "bg-[radial-gradient(circle_at_50%_0%,#34347c_0%,#2d2d6c_100%)] text-white hover:opacity-90"
                : "bg-[#e8e7ed] text-[#12161b]/50 cursor-not-allowed"
            }`}
          >
            {submitting ? "Отправляем…" : "Далее"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="flex items-center justify-center gap-[6px]">
            <p className="text-[14px] text-[rgba(18,22,27,0.6)]">Уже есть аккаунт?</p>
            <button
              type="button"
              onClick={() => onSwitchToLogin()}
              className="text-[14px] font-semibold text-[#34347c] hover:opacity-80 transition-colors"
            >
              Войти
            </button>
          </div>

          <LegalConsents
            value={consents}
            onChange={(next) => {
              setConsents(next);
              setConsentErrors({});
            }}
            errors={consentErrors}
            idPrefix="register-consent"
          />
        </form>
      )}

    </>
  );
}
