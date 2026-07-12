"use client";
import { X } from "lucide-react";
import { AuthWindowProps } from "@/src/interfaces/form";
import AuthForm from "@/src/app/components/forms/auth";
import { useBodyScrollLock } from "@/src/app/hooks/useBodyScrollLock";

export function AuthFormWindow({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSwitchToReset,
  prefillPhone,
  prefillPhoneOtpSent,
  prefillExpiresInSec,
}: AuthWindowProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

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
          className="absolute top-[16px] right-[16px] w-[36px] h-[36px] rounded-full flex items-center justify-center text-[rgba(18,22,27,0.6)] hover:text-[#12161b] hover:bg-[#f7f6f9] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <AuthForm
          onSwitchToRegister={onSwitchToRegister}
          onSwitchToReset={onSwitchToReset}
          onClose={onClose}
          prefillPhone={prefillPhone}
          prefillPhoneOtpSent={prefillPhoneOtpSent}
          prefillExpiresInSec={prefillExpiresInSec}
        />
      </div>
    </div>
  );
}
