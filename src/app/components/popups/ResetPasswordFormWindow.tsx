"use client";
import { X } from "lucide-react";
import { FormWindowProps } from "@/src/interfaces/form";
import ForgotPasswordForm from "@/src/app/components/forms/forgot";

export function ResetPasswordFormWindow({ isOpen, onClose, onSwitchToLogin }: FormWindowProps) {
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

        <ForgotPasswordForm onSwitchToLogin={onSwitchToLogin} />
      </div>
    </div>
  );
}
