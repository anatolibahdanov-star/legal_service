"use client";
import { useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import { FormWindowProps } from "@/src/interfaces/form";
import RegisterForm from "@/src/app/components/forms/register";
import RegisterPhoneForm from "@/src/app/components/forms/register-phone";

type Mode = "phone" | "email";

const PILL_BG = "bg-[#EFE7D8]";

export function RegisterFormWindow({ isOpen, onClose, onSwitchToLogin }: FormWindowProps) {
  const [mode, setMode] = useState<Mode>("phone");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] pt-[64px] px-[32px] pb-[32px] w-full max-w-[520px] relative max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[16px] right-[16px] w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#0F1B2D]/60 hover:text-[#0F1B2D] hover:bg-[#EFE7D8] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-[24px] pr-[24px]">
          <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[10px]">
            Регистрация
          </h1>
          <p className="font-normal text-[14px] leading-[22px] text-[#6B7280]">
            Создайте учётную запись для доступа к консультациям юристов и личному кабинету.
          </p>
        </div>

        <div className={`flex gap-[4px] mb-[24px] p-[6px] ${PILL_BG} rounded-full`}>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
              mode === "phone"
                ? "bg-white text-[#0F1B2D] shadow-sm"
                : "text-[#0F1B2D]/70 hover:text-[#0F1B2D]"
            }`}
          >
            <Phone className="w-4 h-4" /> Телефон
          </button>
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 h-[44px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center gap-[8px] ${
              mode === "email"
                ? "bg-white text-[#0F1B2D] shadow-sm"
                : "text-[#0F1B2D]/70 hover:text-[#0F1B2D]"
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>

        {mode === "phone" ? (
          <RegisterPhoneForm onSwitchToLogin={onSwitchToLogin} onClose={onClose} />
        ) : (
          <RegisterForm onSwitchToLogin={onSwitchToLogin} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
