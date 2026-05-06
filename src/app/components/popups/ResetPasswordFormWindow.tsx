import { FormWindowProps } from "@/src/interfaces/form";
import ForgotPasswordForm from "@/src/app/components/forms/forgot"

export function ResetPasswordFormWindow({ isOpen, onClose, onSwitchToLogin }: FormWindowProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#3d4b5e] rounded-[24px] p-[40px] w-full max-w-[540px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-[20px] right-[20px] text-white/60 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <ForgotPasswordForm onSwitchToLogin={onSwitchToLogin} />
      </div>
    </div>
  );
}
