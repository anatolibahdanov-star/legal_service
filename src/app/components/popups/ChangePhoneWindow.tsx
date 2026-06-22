"use client";
import { useCallback, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Phone, X } from "lucide-react";
import { PHONE_MASK_TEMPLATE, formatPhoneInput, isPhoneComplete } from "@/src/libs/phoneMask";
import { useYandexInvisibleCaptcha } from "@/src/app/components/forms/useYandexInvisibleCaptcha";
import { usePhoneBlockCountdown } from "@/src/app/components/forms/hooks/usePhoneBlockCountdown";
import OtpCodeStep, { OtpStepResult } from "@/src/app/components/forms/OtpCodeStep";
import {
  sendChangePhoneOtpAction,
  verifyChangePhoneOtpAction,
} from "@/src/app/components/forms/action/change-phone";

const FIELD_BG = "bg-[#EFE7D8]";

interface ChangePhoneWindowProps {
  isOpen: boolean;
  currentPhone: string;
  onClose: () => void;
  onChanged: (newPhone: string) => void;
}

type Step = "phone" | "code";

function ChangePhoneForm({
  currentPhone,
  onClose,
  onChanged,
}: {
  currentPhone: string;
  onClose: () => void;
  onChanged: (newPhone: string) => void;
}) {
  const { execute: executeCaptcha } = useYandexInvisibleCaptcha();
  const block = usePhoneBlockCountdown();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(() => formatPhoneInput(currentPhone));
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [commonError, setCommonError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentDigits = useMemo(() => (currentPhone || "").replace(/\D/g, ""), [currentPhone]);
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = useMemo(() => isPhoneComplete(phone), [phone]);
  const isSamePhone = phoneValid && phoneDigits === currentDigits;
  const canSubmit = phoneValid && !isSamePhone && !submitting && !block.blocked;

  const handlePhoneChange = (raw: string) => {
    const formatted = formatPhoneInput(raw);
    setPhone(formatted);
    setPhoneError(
      !formatted || isPhoneComplete(formatted) ? "" : "Введите корректный номер телефона",
    );
    setCommonError("");
    block.reset();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPhoneError("");
    setCommonError("");
    setSubmitting(true);
    let token: string;
    try {
      token = await executeCaptcha();
    } catch {
      setSubmitting(false);
      setCommonError("Не удалось пройти проверку. Попробуйте позже.");
      return;
    }
    const response = await sendChangePhoneOtpAction({ phone, captchaToken: token });
    setSubmitting(false);
    if (!response.status) {
      const errData = response.data as
        | { cooldownUntil?: string | null; lockedUntil?: string | null }
        | null;
      block.applyFromServer(errData);
      setCommonError(response.error || "Не удалось отправить код.");
      return;
    }
    const data = response.data as { phone: string; expiresInSec: number; devCode?: string };
    if (data.devCode) console.info("[DEV] OTP code:", data.devCode);
    setNormalizedPhone(data.phone);
    setStep("code");
  };

  const handleResend = useCallback(async (): Promise<OtpStepResult> => {
    const targetPhone = normalizedPhone || phone;
    if (!targetPhone) {
      return { ok: false, message: "Не удалось определить номер телефона." };
    }
    try {
      const token = await executeCaptcha();
      const response = await sendChangePhoneOtpAction({ phone: targetPhone, captchaToken: token });
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
      if (data.devCode) console.info("[DEV] OTP code:", data.devCode);
      setNormalizedPhone(data.phone);
      return { ok: true, devCode: data.devCode };
    } catch {
      return { ok: false, message: "Не удалось отправить код. Попробуйте позже." };
    }
  }, [executeCaptcha, normalizedPhone, phone]);

  const handleVerify = async (otpCode: string): Promise<OtpStepResult> => {
    const response = await verifyChangePhoneOtpAction({ phone: normalizedPhone, code: otpCode });
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
    const data = response.data as { phone: string };
    onChanged(data.phone);
    return { ok: true };
  };

  if (step === "code") {
    return (
      <OtpCodeStep
        phone={normalizedPhone}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangePhone={() => {
          setStep("phone");
          setPhoneError("");
          setCommonError("");
        }}
      />
    );
  }

  return (
    <>
      <div className="mb-[24px] pr-[24px]">
        <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[10px]">
          Смена номера телефона
        </h1>
        <p className="text-[14px] leading-[22px] text-[#6B7280]">
          Введите новый номер телефона. Мы отправим на него SMS с кодом подтверждения.
        </p>
      </div>

      <form onSubmit={handleSendOtp} className="flex flex-col gap-[18px]" noValidate>
        {commonError && (
          <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
            <div>
              <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
                {block.locked ? "Номер временно заблокирован" : "Не удалось отправить код"}
              </p>
              <p className="text-[13px] text-red-600 leading-[18px]">{commonError}</p>
              {block.blocked && (
                <p className="text-[13px] text-red-600 leading-[18px] mt-[4px]">
                  {block.locked ? "Попробуйте через" : "Повторная отправка через"}{" "}
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
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={PHONE_MASK_TEMPLATE}
              className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                phoneError ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
              } transition-all`}
            />
          </div>
          {phoneError ? (
            <p className="text-[12px] text-red-500 ml-[4px]">{phoneError}</p>
          ) : isSamePhone ? (
            <p className="text-[12px] text-[#6B7280] ml-[4px]">
              Это ваш текущий номер. Введите новый, чтобы продолжить.
            </p>
          ) : (
            <p className="text-[13px] text-[#6B7280] ml-[4px]">Отправим SMS c кодом подтверждения</p>
          )}
        </div>

        <div className="flex gap-[12px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[52px] rounded-[14px] font-semibold text-[15px] border border-[#D6E3EF] text-[#0F1B2D] hover:bg-[#EFE7D8] transition-colors"
          >
            Отменить
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex-1 h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
              canSubmit
                ? "bg-[#5A8FB5] text-white hover:bg-[#4A7EA3]"
                : "bg-[#D6E3EF] text-[#0F1B2D]/50 cursor-not-allowed"
            }`}
          >
            {submitting ? "Отправляем…" : "Подтвердить"}
            {!submitting && canSubmit && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </>
  );
}

export function ChangePhoneWindow({ isOpen, currentPhone, onClose, onChanged }: ChangePhoneWindowProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-[32px] w-full max-w-[520px] relative max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[16px] right-[16px] w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#0F1B2D]/60 hover:text-[#0F1B2D] hover:bg-[#EFE7D8] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <ChangePhoneForm currentPhone={currentPhone} onClose={onClose} onChanged={onChanged} />
      </div>
    </div>
  );
}
