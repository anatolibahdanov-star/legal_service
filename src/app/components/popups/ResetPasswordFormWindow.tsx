"use client";
import { useState } from "react";
import { Lock, Mail, Phone, X } from "lucide-react";
import { FormWindowProps } from "@/src/interfaces/form";
import ForgotEmailForm from "@/src/app/components/forms/forgot-email";
import ForgotPhoneForm from "@/src/app/components/forms/forgot-phone";

type Mode = "email" | "phone";

const PILL_BG = "bg-[#EFE7D8]";

const SUBTITLE: Record<Mode, string> = {
  email: "Введите email для получения нового пароля",
  phone: "Введите номер телефона — отправим код, а затем новый пароль в SMS",
};

export function ResetPasswordFormWindow({ isOpen, onClose, onSwitchToLogin }: FormWindowProps) {
  const [mode, setMode] = useState<Mode>("phone");
  // Forms toggle this when they enter their own "full-takeover" stages
  // (OTP step, success screen) so the popup-level header doesn't duplicate
  // their internal heading.
  const [headerless, setHeaderless] = useState(false);

  if (!isOpen) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setHeaderless(false);
  };

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

        {!headerless && (
          <>
            <div className="w-[56px] h-[56px] rounded-[14px] bg-[#D6E3EF] flex items-center justify-center mb-[20px]">
              <Lock className="w-6 h-6 text-[#0F1B2D]" strokeWidth={2.25} />
            </div>

            <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[8px]">
              Восстановление пароля
            </h1>
            <p className="text-[14px] leading-[22px] text-[#6B7280] mb-[20px]">
              {SUBTITLE[mode]}
            </p>

            <div className={`flex gap-[4px] mb-[24px] p-[6px] ${PILL_BG} rounded-full`}>
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
                  mode === "email"
                    ? "bg-white text-[#0F1B2D] shadow-sm"
                    : "text-[#0F1B2D]/70 hover:text-[#0F1B2D]"
                }`}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
                  mode === "phone"
                    ? "bg-white text-[#0F1B2D] shadow-sm"
                    : "text-[#0F1B2D]/70 hover:text-[#0F1B2D]"
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
