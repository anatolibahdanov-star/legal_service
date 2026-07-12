"use client";
import { useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import { FormWindowProps } from "@/src/interfaces/form";
import ForgotEmailForm from "@/src/app/components/forms/forgot-email";
import ForgotPhoneForm from "@/src/app/components/forms/forgot-phone";
import { useBodyScrollLock } from "@/src/app/hooks/useBodyScrollLock";

type Mode = "email" | "phone";

const PILL_BG = "bg-[#f7f6f9]";

const SUBTITLE: Record<Mode, string> = {
  email: "Введите email для получения нового пароля",
  phone: "Введите номер телефона — отправим код, а затем новый пароль в SMS",
};

export function ResetPasswordFormWindow({ isOpen, onClose, onSwitchToLogin }: FormWindowProps) {
  const [mode, setMode] = useState<Mode>("email");
  // Forms toggle this when they enter their own "full-takeover" stages
  // (OTP step, success screen) so the popup-level header doesn't duplicate
  // their internal heading.
  const [headerless, setHeaderless] = useState(false);
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setHeaderless(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[1400]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-[32px] w-full max-w-[520px] relative max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[16px] right-[16px] w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#12161b]/60 hover:text-[#12161b] hover:bg-[#f7f6f9] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {!headerless && (
          <>
            <h1 className="font-bold text-[26px] leading-[32px] text-[#12161b] mb-[8px]">
              Восстановление пароля
            </h1>
            <p className="text-[14px] leading-[22px] text-[rgba(18,22,27,0.6)] mb-[20px]">
              {SUBTITLE[mode]}
            </p>

            <div className={`flex gap-[4px] mb-[24px] p-[6px] ${PILL_BG} rounded-full`}>
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
                  mode === "email"
                    ? "bg-white text-[#12161b] shadow-sm"
                    : "text-[#12161b]/70 hover:text-[#12161b]"
                }`}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
                  mode === "phone"
                    ? "bg-white text-[#12161b] shadow-sm"
                    : "text-[#12161b]/70 hover:text-[#12161b]"
                }`}
              >
                <Phone className="w-4 h-4" /> Телефон
              </button>
            </div>
          </>
        )}

        {mode === "phone" ? (
          <ForgotPhoneForm
            onSwitchToLogin={onSwitchToLogin}
            onHeaderlessChange={setHeaderless}
          />
        ) : (
          <ForgotEmailForm
            onSwitchToLogin={onSwitchToLogin}
            onHeaderlessChange={setHeaderless}
          />
        )}
      </div>
    </div>
  );
}
