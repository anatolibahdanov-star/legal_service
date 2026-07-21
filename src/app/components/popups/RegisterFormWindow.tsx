"use client";
import { useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import { FormWindowProps } from "@/src/interfaces/form";
import RegisterForm from "@/src/app/components/forms/register";
import RegisterPhoneForm from "@/src/app/components/forms/register-phone";
import { useBodyScrollLock } from "@/src/app/hooks/useBodyScrollLock";

type Mode = "phone" | "email";

const PILL_BG = "bg-[#f7f6f9]";

export function RegisterFormWindow({ isOpen, onClose, onSwitchToLogin }: FormWindowProps) {
  const [mode, setMode] = useState<Mode>("phone");
  useBodyScrollLock(isOpen);

  // Keep mounted while closed so draft fields survive overlay dismiss / reopen.
  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[1400] ${
        isOpen ? "" : "hidden"
      }`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className="bg-white rounded-[24px] pt-[64px] px-[32px] pb-[32px] w-full max-w-[520px] relative max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[16px] right-[16px] w-[36px] h-[36px] rounded-full flex items-center justify-center text-[rgba(18,22,27,0.6)] hover:text-[#12161b] hover:bg-[#f7f6f9] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-[24px] pr-[24px]">
          <h1 className="font-bold text-[26px] leading-[32px] text-[#12161b] mb-[10px]">
            Регистрация
          </h1>
          <p className="font-normal text-[14px] leading-[22px] text-[rgba(18,22,27,0.6)]">
            Создайте учётную запись для доступа к консультациям юристов и личному кабинету.
          </p>
        </div>

        <div className={`flex gap-[4px] mb-[24px] p-[6px] ${PILL_BG} rounded-full`}>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
              mode === "phone"
                ? "bg-white text-[#12161b] shadow-sm"
                : "text-[rgba(18,22,27,0.7)] hover:text-[#12161b]"
            }`}
          >
            <Phone className="w-4 h-4" /> Телефон
          </button>
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
              mode === "email"
                ? "bg-white text-[#12161b] shadow-sm"
                : "text-[rgba(18,22,27,0.7)] hover:text-[#12161b]"
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>

        {/* Keep both modes mounted so switching phone/email does not wipe drafts. */}
        <div className={mode === "phone" ? "" : "hidden"}>
          <RegisterPhoneForm onSwitchToLogin={onSwitchToLogin} onClose={onClose} />
        </div>
        <div className={mode === "email" ? "" : "hidden"}>
          <RegisterForm onSwitchToLogin={onSwitchToLogin} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
