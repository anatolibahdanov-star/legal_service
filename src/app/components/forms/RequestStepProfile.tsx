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
    <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Куда отправить ответ?</h2>
      <p className="text-white/80 text-sm leading-relaxed mb-5 sm:mb-6">
        Email поможет не потерять ответ юриста и восстановить доступ к вашему аккаунту при необходимости.
      </p>

      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-px" />
          <p className="text-sm text-emerald-100">
            {verificationSent
              ? "Мы отправили письмо для подтверждения email"
              : "Данные сохранены"}
          </p>
        </div>
      )}

      {commonError && !success && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/40 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-px" />
          <p className="text-sm text-red-200">{commonError}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Имя */}
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-white/90 mb-2">
            Имя
          </label>
          <div
            className={cn(
              "rounded-2xl p-3 border-2",
              touched.name && nameError ? "border-red-400/60" : "border-transparent"
            )}
            style={{ backgroundColor: FIELD_BG }}
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
              className="w-full bg-transparent border-0 px-2 py-1 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-0 disabled:opacity-60"
            />
          </div>
          {touched.name && nameError ? (
            <p className="text-[12px] text-red-300 mt-2 ml-1">{nameError}</p>
          ) : (
            <p className="text-[12px] text-white/50 mt-2 ml-1">Необязательно</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="profile-email" className="block text-sm font-medium text-white/90 mb-2">
            Email <span className="text-red-300">*</span>
          </label>
          <div
            className={cn(
              "rounded-2xl p-3 border-2",
              touched.email && emailError ? "border-red-400/60" : "border-transparent"
            )}
            style={{ backgroundColor: FIELD_BG }}
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
              className="w-full bg-transparent border-0 px-2 py-1 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-0 disabled:opacity-60"
            />
          </div>
          {touched.email && emailError && (
            <p className="text-[12px] text-red-300 mt-2 ml-1">{emailError}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={!canSubmit}
          className={cn(
            "w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg",
            !canSubmit
              ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
              : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
          )}
          style={canSubmit ? { backgroundColor: BRAND } : undefined}
        >
          {submitting ? "Сохраняем…" : success ? "Готово" : "Далее"}
        </button>
      </div>
    </div>
  );
}
