"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, getSession, signIn } from "next-auth/react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Phone } from "lucide-react";
import { AuthFormPropsI } from "@/src/interfaces/form";
import { PHONE_MASK_TEMPLATE, formatPhoneInput, isPhoneComplete } from "@/src/libs/phoneMask";
import {
  sendLoginPhoneOtpAction,
  verifyLoginPhoneOtpAction,
} from "@/src/app/components/forms/action/login-phone";
import { signInWithPhoneOtp } from "@/src/app/components/forms/action/register-phone";
import { RecaptchaCheckbox } from "@/src/app/components/forms/RecaptchaCheckbox";
import OtpCodeStep, { OtpStepResult } from "@/src/app/components/forms/OtpCodeStep";

type Tab = "email" | "phone";
type PhoneStep = "phone" | "code";

const FIELD_BG = "bg-[#EFE7D8]";
const PILL_BG = "bg-[#EFE7D8]";
const PASSWORD_MIN_LENGTH = 6;
const HAS_LATIN_LETTER = /[a-zA-Z]/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ParsedAuthError {
  message: string;
  code?: string;
  attemptsLeft?: number;
}

const parseAuthError = (raw: string | undefined | null): ParsedAuthError => {
  if (!raw) return { message: "Ошибка авторизации." };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
      return parsed as ParsedAuthError;
    }
  } catch {}
  return { message: raw };
};

export default function AuthForm({
  onClose,
  onSwitchToRegister,
  onSwitchToReset,
  prefillPhone,
}: AuthFormPropsI) {
  const router = useRouter();
  const { update } = useSession();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [tab, setTab] = useState<Tab>(prefillPhone ? "phone" : "email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailCaptchaToken, setEmailCaptchaToken] = useState<string | null>(null);
  const [emailErrors, setEmailErrors] = useState({ email: "", password: "", common: "" });
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);
  // const passwordValid =
  //   password.length >= PASSWORD_MIN_LENGTH && HAS_LATIN_LETTER.test(password);
  const passwordValid =
    password.length >= PASSWORD_MIN_LENGTH;
  const canSubmitEmail = emailValid && passwordValid && !!emailCaptchaToken && !emailSubmitting;

  const passwordPolicyError = (value: string): string => {
    if (!value) return "";
    if (value.length < PASSWORD_MIN_LENGTH) return `Минимум ${PASSWORD_MIN_LENGTH} символов`;
    // if (!HAS_LATIN_LETTER.test(value)) return "There must be at least one Latin letter";
    return "";
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailErrors((prev) => ({
      ...prev,
      email: !value || EMAIL_REGEX.test(value) ? "" : "Некорректный формат email",
      common: "",
    }));
    setAttemptsLeft(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setEmailErrors((prev) => ({
      ...prev,
      password: passwordPolicyError(value),
      common: "",
    }));
    setAttemptsLeft(null);
  };

  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [phone, setPhone] = useState(prefillPhone ? formatPhoneInput(prefillPhone) : "");
  const [phoneCaptchaToken, setPhoneCaptchaToken] = useState<string | null>(null);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [phoneErrors, setPhoneErrors] = useState({ phone: "", code: "", common: "" });
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);

  useEffect(() => {
    if (prefillPhone) {
      setTab("phone");
      setPhone(formatPhoneInput(prefillPhone));
    }
  }, [prefillPhone]);

  const phoneValid = useMemo(() => isPhoneComplete(phone), [phone]);
  const canSubmitPhone = phoneValid && !!phoneCaptchaToken && !phoneSubmitting;

  const handlePhoneChange = (raw: string) => {
    const formatted = formatPhoneInput(raw);
    setPhone(formatted);
    setPhoneErrors((prev) => ({
      ...prev,
      phone:
        !formatted || isPhoneComplete(formatted)
          ? ""
          : "Введите корректный номер телефона",
      common: "",
    }));
  };

  const finishSignInRedirect = async () => {
    await update();
    const session = await getSession();
    const user = session?.user;
    onClose();
    if (user && user.role !== "user") {
      router.push("/admin");
    } else {
      router.push("/profile");
    }
    router.refresh();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitEmail) return;
    setEmailSubmitting(true);
    setEmailErrors({ email: "", password: "", common: "" });
    const response = await signIn("credentials", {
      username: email,
      password,
      captchaToken: emailCaptchaToken,
      redirect: false,
    });
    if (response?.error) {
      setEmailSubmitting(false);
      setEmailCaptchaToken(null);
      const parsed = parseAuthError(response.error);
      setEmailErrors((prev) => ({ ...prev, common: parsed.message }));
      setAttemptsLeft(typeof parsed.attemptsLeft === "number" ? parsed.attemptsLeft : null);
      return;
    }
    await finishSignInRedirect();
    setEmailSubmitting(false);
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPhone) return;
    setPhoneErrors({ phone: "", code: "", common: "" });
    setPhoneSubmitting(true);
    const response = await sendLoginPhoneOtpAction({
      phone,
      captchaToken: phoneCaptchaToken ?? "",
    });
    setPhoneSubmitting(false);
    setPhoneCaptchaToken(null);
    if (!response.status) {
      setPhoneErrors((prev) => ({ ...prev, common: response.error || "Не удалось отправить код." }));
      return;
    }
    const data = response.data as { phone: string; expiresInSec: number; devCode?: string };
    setNormalizedPhone(data.phone);
    if (data.devCode) console.info("[DEV] OTP code:", data.devCode);
    setPhoneStep("code");
  };

  const handlePhoneResend = useCallback(async (): Promise<OtpStepResult> => {
    if (!executeRecaptcha) {
      return { ok: false, message: "Сервис проверки недоступен. Обновите страницу." };
    }
    const targetPhone = normalizedPhone || phone;
    if (!targetPhone) {
      return { ok: false, message: "Не удалось определить номер телефона." };
    }
    try {
      const token = await executeRecaptcha("login_phone");
      const response = await sendLoginPhoneOtpAction({
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
  }, [executeRecaptcha, normalizedPhone, phone]);

  const handlePhoneVerify = async (otpCode: string): Promise<OtpStepResult> => {
    const response = await verifyLoginPhoneOtpAction({ phone: normalizedPhone, code: otpCode });
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
      return { ok: false, message: signInResult.error || "Ошибка авторизации. Попробуйте позже." };
    }
    await finishSignInRedirect();
    return { ok: true };
  };

  const goBackToPhoneStep = (): OtpStepResult => {
    setPhoneStep("phone");
    setPhoneErrors({ phone: "", code: "", common: "" });
    return { ok: true };
  };

  if (tab === "phone" && phoneStep === "code") {
    return (
      <OtpCodeStep
        phone={normalizedPhone}
        onVerify={handlePhoneVerify}
        onResend={handlePhoneResend}
        onChangePhone={() => {
          goBackToPhoneStep();
        }}
        initialResendCooldown={24 * 60 * 60}
      />
    );
  }

  return (
    <>
      <div className="mb-[24px] pr-[24px]">
        <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[10px]">
          Вход в систему
        </h1>
        <p className="font-normal text-[14px] leading-[22px] text-[#6B7280]">
          Войдите в свою учетную запись для доступа к личному кабинету и консультациям с юристами.
        </p>
      </div>

      <div className={`flex gap-[4px] mb-[24px] p-[6px] ${PILL_BG} rounded-full`}>
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
            tab === "email"
              ? "bg-white text-[#0F1B2D] shadow-sm"
              : "text-[#0F1B2D]/70 hover:text-[#0F1B2D]"
          }`}
        >
          <Mail className="w-4 h-4" /> Email
        </button>
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
            tab === "phone"
              ? "bg-white text-[#0F1B2D] shadow-sm"
              : "text-[#0F1B2D]/70 hover:text-[#0F1B2D]"
          }`}
        >
          <Phone className="w-4 h-4" /> Телефон
        </button>
      </div>

      {tab === "email" && (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-[18px]" noValidate>
          {emailErrors.common && (
            <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
              <div>
                <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
                  Не удалось войти
                </p>
                <p className="text-[13px] text-red-600 leading-[18px]">{emailErrors.common}</p>
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
                  emailErrors.email ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
                } transition-all`}
              />
            </div>
            {emailErrors.email && (
              <p className="text-[12px] text-red-500 ml-[4px]">{emailErrors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[14px] text-[#0F1B2D]">Пароль</label>
              <button
                type="button"
                onClick={onSwitchToReset}
                className="text-[13px] text-[#9BB7C9] hover:text-[#7DA0B7] font-medium transition-colors"
              >
                Забыли пароль?
              </button>
            </div>
            <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
              <Lock className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Минимум 8 символов"
                className={`w-full h-full pl-[44px] pr-[44px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                  emailErrors.password ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
                } transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60 hover:text-[#0F1B2D] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {emailErrors.password && (
              <p className="text-[12px] text-red-500 ml-[4px]">{emailErrors.password}</p>
            )}
          </div>

          <RecaptchaCheckbox
            action="login_email"
            token={emailCaptchaToken}
            onChange={setEmailCaptchaToken}
            disabled={emailSubmitting}
          />

          {attemptsLeft !== null && attemptsLeft > 0 && (
            <p className="text-center text-[13px] text-[#6B7280]">
              Осталось попыток: <span className="font-bold text-[#0F1B2D]">{attemptsLeft}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmitEmail}
            className={`h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
              canSubmitEmail
                ? "bg-[#5A8FB5] text-white hover:bg-[#4A7EA3]"
                : "bg-[#D6E3EF] text-[#0F1B2D]/50 cursor-not-allowed"
            }`}
          >
            {emailSubmitting ? "Входим…" : "Войти"}
            {!emailSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="flex items-center justify-center gap-[6px]">
            <p className="text-[14px] text-[#6B7280]">Нет аккаунта?</p>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[14px] font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
            >
              Зарегистрироваться
            </button>
          </div>
        </form>
      )}

      {tab === "phone" && phoneStep === "phone" && (
        <form onSubmit={handleSendPhoneOtp} className="flex flex-col gap-[18px]" noValidate>
          {phoneErrors.common && (
            <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
              <div>
                <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
                  Не удалось отправить код
                </p>
                <p className="text-[13px] text-red-600 leading-[18px]">{phoneErrors.common}</p>
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
                  phoneErrors.phone ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
                } transition-all`}
              />
            </div>
            {phoneErrors.phone ? (
              <p className="text-[12px] text-red-500 ml-[4px]">{phoneErrors.phone}</p>
            ) : (
              <p className="text-[13px] text-[#6B7280] ml-[4px]">
                Отправим SMS c кодом подтверждения
              </p>
            )}
          </div>

          <RecaptchaCheckbox
            action="login_phone"
            token={phoneCaptchaToken}
            onChange={setPhoneCaptchaToken}
            disabled={phoneSubmitting}
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
            {phoneSubmitting ? "Отправляем…" : "Получить код"}
            {!phoneSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="flex items-center justify-center gap-[6px]">
            <p className="text-[14px] text-[#6B7280]">Нет аккаунта?</p>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[14px] font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
            >
              Зарегистрироваться
            </button>
          </div>
        </form>
      )}

    </>
  );
}
