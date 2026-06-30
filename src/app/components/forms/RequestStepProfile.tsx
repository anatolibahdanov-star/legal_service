"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/app/components/ui/utils";

const FIELD_BG = "rgba(143, 170, 186, 0.18)";
const BRAND = "#8faaba";
const NAME_MIN_LENGTH = 2;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CompleteProfileResult {
  ok: boolean;
  message?: string;
  verificationEmailSent?: boolean;
}

interface RequestStepProfileProps {
  initialName: string;
  initialEmail: string;
  variant?: "legacy" | "v2";
  /**
   * Called when the user submits valid name + email.
   * Should persist data to backend and resolve with verificationEmailSent flag.
   */
  onSubmit: (name: string, email: string) => Promise<CompleteProfileResult>;
  /** Called after the success banner is shown long enough; should advance the wizard. */
  onContinue: () => void;
  /** Display the banner for this many ms before auto-advancing. */
  successDelayMs?: number;
}

export default function RequestStepProfile({
  initialName,
  initialEmail,
  variant = "legacy",
  onSubmit,
  onContinue,
  successDelayMs = 2500,
}: RequestStepProfileProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState({ name: false, email: false });
  const [submitting, setSubmitting] = useState(false);
  const [commonError, setCommonError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const nameTrim = name.trim();
  const emailTrim = email.trim();

  const nameError =
    nameTrim.length > 0 && nameTrim.length < NAME_MIN_LENGTH
      ? `Имя должно содержать минимум ${NAME_MIN_LENGTH} символа`
      : null;

  const emailError =
    emailTrim.length === 0
      ? "Email необходим для получения ответа от юриста"
      : !EMAIL_REGEX.test(emailTrim)
        ? "Введите корректный email"
        : null;

  const valid = !emailError && !nameError;
  const canSubmit = valid && !submitting && !success;
  const isV2 = variant === "v2";

  const handleClick = async () => {
    setTouched({ name: true, email: true });
    if (!canSubmit) return;
    setCommonError("");
    setSubmitting(true);
    const res = await onSubmit(nameTrim, emailTrim);
    setSubmitting(false);
    if (!res.ok) {
      setCommonError(res.message ?? "Не удалось сохранить данные. Попробуйте позже.");
      return;
    }
    setVerificationSent(res.verificationEmailSent === true);
    setSuccess(true);
    setTimeout(() => {
      onContinue();
    }, successDelayMs);
  };

  return (
    <div
      className={cn(
        isV2
          ? "flex flex-col gap-6"
          : "bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl"
      )}
    >
      <div className={cn(isV2 && "flex flex-col gap-3")}>
        <h2
          className={cn(
            isV2
              ? "text-[20px] font-semibold leading-6 tracking-tight text-[#12161B]"
              : "text-xl sm:text-2xl font-bold text-white mb-2"
          )}
        >
          Куда отправить ответ?
        </h2>
        <p
          className={cn(
            isV2
              ? "text-[16px] leading-[22px] tracking-tight text-[rgba(18,22,27,0.6)]"
              : "text-white/80 text-sm leading-relaxed mb-5 sm:mb-6"
          )}
        >
        Email поможет не потерять ответ юриста и восстановить доступ к вашему аккаунту при необходимости.
        </p>
      </div>

      {success && (
        <div
          className={cn(
            "px-4 py-3 rounded-xl flex items-start gap-2",
            isV2
              ? "bg-emerald-50 border border-emerald-200"
              : "mb-4 bg-emerald-500/15 border border-emerald-400/40"
          )}
        >
          <CheckCircle2
            className={cn("w-5 h-5 shrink-0 mt-px", isV2 ? "text-emerald-600" : "text-emerald-300")}
          />
          <p className={cn("text-sm", isV2 ? "text-emerald-700" : "text-emerald-100")}>
            {verificationSent
              ? "Мы отправили письмо для подтверждения email"
              : "Данные сохранены"}
          </p>
        </div>
      )}

      {commonError && !success && (
        <div
          className={cn(
            "px-4 py-3 rounded-xl flex items-start gap-2",
            isV2
              ? "bg-red-50 border border-red-200"
              : "mb-4 bg-red-500/15 border border-red-400/40"
          )}
        >
          <AlertCircle className={cn("w-5 h-5 shrink-0 mt-px", isV2 ? "text-red-500" : "text-red-300")} />
          <p className={cn("text-sm", isV2 ? "text-red-600" : "text-red-200")}>{commonError}</p>
        </div>
      )}

      <div className={cn(isV2 ? "flex flex-col gap-5" : "space-y-5")}>
        {/* Имя */}
        <div>
          <label
            htmlFor="profile-name"
            className={cn(
              "block mb-2",
              isV2
                ? "text-[14px] font-medium leading-5 text-[#12161B]"
                : "text-sm font-medium text-white/90"
            )}
          >
            Имя
          </label>
          <div
            className={cn(
              "rounded-2xl p-3 transition-colors",
              isV2
                ? touched.name && nameError
                  ? "border-[1.5px] border-red-400 bg-white"
                  : "border-[1.5px] border-[rgba(18,22,27,0.1)] bg-[#F7F6F9] focus-within:border-[#34347C] focus-within:bg-white"
                : touched.name && nameError
                  ? "border-2 border-red-400/60"
                  : "border-2 border-transparent"
            )}
            style={isV2 ? undefined : { backgroundColor: FIELD_BG }}
          >
            <input
              id="profile-name"
              name="name"
              type="text"
              autoComplete="given-name"
              autoFocus
              disabled={submitting || success}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Как к вам обращаться"
              aria-invalid={!!(touched.name && nameError)}
              className={cn(
                "w-full bg-transparent border-0 px-2 py-1 focus:outline-none focus:ring-0 disabled:opacity-60",
                isV2
                  ? "text-[14px] leading-5 text-[#12161B] placeholder:text-[rgba(18,22,27,0.35)]"
                  : "text-base text-white placeholder:text-white/40"
              )}
            />
          </div>
          {touched.name && nameError ? (
            <p className={cn("text-[12px] mt-2 ml-1", isV2 ? "text-red-500" : "text-red-300")}>
              {nameError}
            </p>
          ) : (
            <p className={cn("text-[12px] mt-2 ml-1", isV2 ? "text-[rgba(18,22,27,0.5)]" : "text-white/50")}>
              Необязательно
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="profile-email"
            className={cn(
              "block mb-2",
              isV2
                ? "text-[14px] font-medium leading-5 text-[#12161B]"
                : "text-sm font-medium text-white/90"
            )}
          >
            Email <span className={isV2 ? "text-red-500" : "text-red-300"}>*</span>
          </label>
          <div
            className={cn(
              "rounded-2xl p-3 transition-colors",
              isV2
                ? touched.email && emailError
                  ? "border-[1.5px] border-red-400 bg-white"
                  : "border-[1.5px] border-[rgba(18,22,27,0.1)] bg-[#F7F6F9] focus-within:border-[#34347C] focus-within:bg-white"
                : touched.email && emailError
                  ? "border-2 border-red-400/60"
                  : "border-2 border-transparent"
            )}
            style={isV2 ? undefined : { backgroundColor: FIELD_BG }}
          >
            <input
              id="profile-email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={submitting || success}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="you@example.com"
              aria-invalid={!!(touched.email && emailError)}
              className={cn(
                "w-full bg-transparent border-0 px-2 py-1 focus:outline-none focus:ring-0 disabled:opacity-60",
                isV2
                  ? "text-[14px] leading-5 text-[#12161B] placeholder:text-[rgba(18,22,27,0.35)]"
                  : "text-base text-white placeholder:text-white/40"
              )}
            />
          </div>
          {touched.email && emailError && (
            <p className={cn("text-[12px] mt-2 ml-1", isV2 ? "text-red-500" : "text-red-300")}>
              {emailError}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={!canSubmit}
          className={cn(
            "w-full font-medium px-6 transition-all text-lg disabled:cursor-not-allowed",
            isV2
              ? "h-14 rounded-[35px] text-white hover:opacity-85 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              : "py-4 rounded-2xl transition-colors",
            !canSubmit && !isV2
              ? "bg-[#8faaba]/50 text-white/70"
              : !isV2
                ? "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
                : ""
          )}
          style={
            isV2
              ? { background: "radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)" }
              : canSubmit
                ? { backgroundColor: BRAND }
                : undefined
          }
        >
          {submitting ? "Сохраняем…" : success ? "Готово" : "Далее"}
        </button>
      </div>
    </div>
  );
}
