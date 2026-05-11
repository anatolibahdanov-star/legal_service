"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, useSession } from "next-auth/react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { validateRegisterForm } from "@/src/app/components/forms/validation/register";
import { submitRegisterFormAction } from "@/src/app/components/forms/action/register";
import { RegisterFormI, FormContainerProps } from "@/src/interfaces/form";

const FIELD_BG = "bg-[#EFE7D8]";
const PASSWORD_MIN_LENGTH = 8;
const HAS_LATIN_LETTER = /[a-zA-Z]/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterForm({ onClose, onSwitchToLogin }: FormContainerProps) {
  const router = useRouter();
  const { update } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    common: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);
  const passwordValid =
    password.length >= PASSWORD_MIN_LENGTH && HAS_LATIN_LETTER.test(password);
  const canSubmit =
    name.trim().length > 0 &&
    emailValid &&
    passwordValid &&
    password === confirmPassword &&
    confirmPassword.length > 0 &&
    !submitting;

  const passwordPolicyError = (value: string): string => {
    if (!value) return "";
    if (value.length < PASSWORD_MIN_LENGTH) return `Минимум ${PASSWORD_MIN_LENGTH} символов`;
    if (!HAS_LATIN_LETTER.test(value)) return "Должна быть хотя бы одна латинская буква";
    return "";
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setErrors((prev) => ({
      ...prev,
      name: !value || value.trim() ? "" : "Введите имя",
      common: "",
    }));
  };
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: !value || EMAIL_REGEX.test(value) ? "" : "Некорректный формат email",
      common: "",
    }));
  };
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: passwordPolicyError(value),
      confirmPassword:
        confirmPassword && confirmPassword !== value ? "Пароли не совпадают." : "",
      common: "",
    }));
  };
  const handleConfirmChange = (value: string) => {
    setConfirmPassword(value);
    setErrors((prev) => ({
      ...prev,
      confirmPassword: value && value !== password ? "Пароли не совпадают." : "",
      common: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: RegisterFormI = { email, name, password, confirmPassword };

    const validResult = validateRegisterForm(data);
    if (!validResult.is_success) {
      const next = { name: "", email: "", password: "", confirmPassword: "", common: "" };
      validResult.errors?.forEach((err) => {
        if (err.field in next) {
          (next as Record<string, string>)[err.field] = err.error.join(" ");
        }
      });
      next.common = "Проверьте правильность заполнения полей.";
      setErrors(next);
      return;
    }

    setErrors({ name: "", email: "", password: "", confirmPassword: "", common: "" });
    setSubmitting(true);
    const registerData = await submitRegisterFormAction(data);
    if (!registerData.status) {
      setSubmitting(false);
      setErrors((prev) => ({ ...prev, common: registerData.error }));
      return;
    }

    await update();
    const session = await getSession();
    if (!session?.user) {
      setSubmitting(false);
      setErrors((prev) => ({
        ...prev,
        common: "Произошла техническая ошибка. Попробуйте зарегистрироваться еще раз.",
      }));
      return;
    }

    onClose();
    router.push("/profile");
    router.refresh();
  };

  return (
    <>
      <div className="mb-[24px] pr-[24px]">
        <h1 className="font-bold text-[26px] leading-[32px] text-[#0F1B2D] mb-[10px]">
          Регистрация
        </h1>
        <p className="font-normal text-[14px] leading-[22px] text-[#6B7280]">
          Создайте учётную запись для доступа к консультациям юристов и личному кабинету.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]" noValidate>
        {errors.common && (
          <div className="px-[16px] py-[12px] rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-[10px]">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-px" />
            <div>
              <p className="font-semibold text-[14px] text-red-700 leading-[18px]">
                Не удалось зарегистрироваться
              </p>
              <p className="text-[13px] text-red-600 leading-[18px]">{errors.common}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-[8px]">
          <label className="font-semibold text-[14px] text-[#0F1B2D]">Ваше имя</label>
          <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
            <User className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60" />
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Имя"
              className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                errors.name ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
              } transition-all`}
            />
          </div>
          {errors.name && <p className="text-[12px] text-red-500 ml-[4px]">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="font-semibold text-[14px] text-[#0F1B2D]">Email</label>
          <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
            <Mail className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@company.com"
              className={`w-full h-full pl-[44px] pr-[16px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                errors.email ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
              } transition-all`}
            />
          </div>
          {errors.email && <p className="text-[12px] text-red-500 ml-[4px]">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="font-semibold text-[14px] text-[#0F1B2D]">Пароль</label>
          <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
            <Lock className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Минимум 8 символов, латинские буквы"
              className={`w-full h-full pl-[44px] pr-[44px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                errors.password ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
              } transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60 hover:text-[#0F1B2D] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[12px] text-red-500 ml-[4px]">{errors.password}</p>
          )}
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="font-semibold text-[14px] text-[#0F1B2D]">Повторите пароль</label>
          <div className={`relative h-[52px] rounded-[14px] ${FIELD_BG}`}>
            <Lock className="w-4 h-4 absolute left-[16px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60" />
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => handleConfirmChange(e.target.value)}
              placeholder="Повторите пароль"
              className={`w-full h-full pl-[44px] pr-[44px] bg-transparent text-[15px] text-[#0F1B2D] placeholder:text-[#0F1B2D]/40 rounded-[14px] outline-none ring-2 ${
                errors.confirmPassword ? "ring-red-400" : "ring-transparent focus:ring-[#9BB7C9]"
              } transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Скрыть пароль" : "Показать пароль"}
              className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#0F1B2D]/60 hover:text-[#0F1B2D] transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[12px] text-red-500 ml-[4px]">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`h-[52px] rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-[8px] transition-all ${
            canSubmit
              ? "bg-[#5A8FB5] text-white hover:bg-[#4A7EA3]"
              : "bg-[#D6E3EF] text-[#0F1B2D]/50 cursor-not-allowed"
          }`}
        >
          {submitting ? "Регистрируем…" : "Зарегистрироваться"}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>

        <div className="flex items-center justify-center gap-[6px]">
          <p className="text-[14px] text-[#6B7280]">Уже есть аккаунт?</p>
          <button
            type="button"
            onClick={() => onSwitchToLogin()}
            className="text-[14px] font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
          >
            Войти
          </button>
        </div>

        <p className="text-[11px] leading-[16px] text-[#0F1B2D]/40 text-center">
          Нажимая «Зарегистрироваться», вы принимаете условия Пользовательского соглашения и
          Политики конфиденциальности.
        </p>
      </form>
    </>
  );
}
