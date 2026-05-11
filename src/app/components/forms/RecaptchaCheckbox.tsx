"use client";

import { useCallback, useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

interface RecaptchaCheckboxProps {
  action: string;
  onChange: (token: string | null) => void;
  token: string | null;
  disabled?: boolean;
}

export function RecaptchaCheckbox({ action, onChange, token, disabled }: RecaptchaCheckboxProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checked = !!token;

  const handleClick = useCallback(async () => {
    if (disabled || loading || checked) return;
    if (!executeRecaptcha) {
      setError("Сервис проверки недоступен. Обновите страницу.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await executeRecaptcha(action);
      onChange(result);
    } catch (err) {
      console.error("[reCAPTCHA] executeRecaptcha failed:", err);
      setError("Не удалось пройти проверку. Попробуйте снова.");
      onChange(null);
    } finally {
      setLoading(false);
    }
  }, [action, checked, disabled, executeRecaptcha, loading, onChange]);

  return (
    <div className="flex flex-col gap-[6px]">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || checked}
        aria-pressed={checked}
        className={`flex items-center justify-between w-full h-[64px] px-[18px] rounded-[14px] bg-white border-2 transition-all ${
          checked
            ? "border-[#5A8FB5]"
            : error
            ? "border-red-300"
            : "border-[#EFE7D8] hover:border-[#D9CDB6]"
        } ${disabled || loading || checked ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-[14px]">
          <span
            className={`w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-colors ${
              checked
                ? "border-[#5A8FB5] bg-[#5A8FB5]"
                : "border-[#D9CDB6] bg-white"
            }`}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 text-[#0F1B2D]/60 animate-spin" />
            ) : checked ? (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            ) : null}
          </span>
          <span className="text-[15px] text-[#0F1B2D] font-medium">Я не робот</span>
        </div>
        <div className="flex flex-col items-center gap-[2px] text-[#0F1B2D]/60">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] tracking-[1px] uppercase">Защита</span>
        </div>
      </button>
      {error && <p className="text-[12px] text-red-500 ml-[4px]">{error}</p>}
    </div>
  );
}
