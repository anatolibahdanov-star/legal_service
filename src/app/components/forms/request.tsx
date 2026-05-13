import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/app/components/ui/select";
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation';
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import {
  validateRequestForm,
  validateQuestionText,
  QUESTION_MAX_LENGTH,
} from "@/src/app/components/forms/validation/request";
import { submitRequestFormAction } from "@/src/app/components/forms/action/request";
import { signInWithPhoneOtp } from "@/src/app/components/forms/action/register-phone";
import { PHONE_MASK_TEMPLATE, formatPhoneInput, isPhoneComplete } from "@/src/libs/phoneMask";
import { FormDataObjectT } from "@/src/interfaces/form";
import { DBQuestion } from "@/src/interfaces/db";
import { SelectCategories } from "@/src/app/components/data/select-category";
import { RecaptchaCheckbox } from "@/src/app/components/forms/RecaptchaCheckbox";
import RequestStepOtp, { OtpStepResult } from "@/src/app/components/forms/RequestStepOtp";
import RequestStepProfile, { CompleteProfileResult } from "@/src/app/components/forms/RequestStepProfile";
import RequestStepPayment from "@/src/app/components/forms/RequestStepPayment";
import RequestStepSuccess from "@/src/app/components/forms/RequestStepSuccess";
import { completeProfileAction } from "@/src/app/components/forms/action/complete-profile";
import {
  wizardSendOtpAction,
  wizardVerifyOtpAction,
  wizardSubmitQuestionAction,
  createWizardCardOrderAction,
  payWithBalanceAction,
} from "@/src/app/components/forms/action/wizard";
import { needsProfileCompletion, isPhoneEmail, phoneToDefaultName, normalizePhoneE164 } from "@/src/libs/phoneIdentity";
import { cn } from "@/src/app/components/ui/utils";

interface RequestFormOptionsI {
    parent?: number|null;
    setCurrent?: (page: boolean) => void;
    setPage?: (page: number) => void;
    onClose?: () => void;
    isProfile?: boolean;
}

const BRAND = "#8faaba";
const FIELD_BG = "rgba(143, 170, 186, 0.18)";

type WizardStep = "question" | "phone" | "otp" | "profile" | "payment" | "success";

/** Formats seconds into a human-readable Russian duration: "1 ч 23 мин", "5 мин", "45 с". */
const formatRetryAfter = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "несколько секунд";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
    if (m > 0) return `${m} мин`;
    return `${s} с`;
};

export default function RequestForm({parent = null, setCurrent, setPage, onClose, isProfile = false}: RequestFormOptionsI) {

    const router = useRouter();
    const { data: session, status } = useSession()
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [errors, setErrors] = useState<FormDataObjectT>({ name: "", email: "", topic: "", question: "", agree: false, common: "", auth: "", parent: 0});
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [questionTouched, setQuestionTouched] = useState(false);
    const [step, setStep] = useState<WizardStep>("question");
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        topic: "",
        question: "",
        agree: false,
        auth: "",
        parent: 0,
    });

    // Phone step state
    const [phone, setPhone] = useState("");
    const [normalizedPhone, setNormalizedPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [phoneCommonError, setPhoneCommonError] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpDevCode, setOtpDevCode] = useState<string | undefined>(undefined);
    const [verifiedUser, setVerifiedUser] = useState<{ id: number; name: string; email: string } | null>(null);
    /** verifyToken survives across verify-otp → profile-save → signIn via peekVerifyToken. */
    const [verifyToken, setVerifyToken] = useState<string>("");
    /** Backend-derived flag: first root question for this user is on the house. */
    const [isFirstQuestionFree, setIsFirstQuestionFree] = useState<boolean>(false);
    /** Question price (rubles) from backend env. */
    const [questionPrice, setQuestionPrice] = useState<number>(0);
    /** User's balance (rubles) from backend. */
    const [userBalance, setUserBalance] = useState<number>(0);
    /** Controls the success-step variant: true → "юрист приступил", false → "сохранён, не отправлен". */
    const [successPaid, setSuccessPaid] = useState<boolean>(true);
    /**
     * Idempotency key for the "pay with balance" action. Generated once per
     * wizard session and reused on retries so the server can dedup repeated
     * requests (double-click, network retry).
     */
    const [paymentIdempotencyKey] = useState<string>(
        () => `wizard_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    );

    if (status === 'loading') {
        return <p>Загружается...</p>;
    }
    let user = null
    if(session && session?.user) user = session?.user

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: FormDataObjectT = { name: "", email: "", topic: "", question: "", agree: false, common: "", auth: "" };

        if (!captchaToken) {
            newErrors.common = "Подтвердите, что вы не робот.";
            setErrors(newErrors);
            return false;
        }

        const dataRequest = {...formData}
        if(user) {
            dataRequest.email = user.email ?? ""
            dataRequest.name = user.name ?? ""
            dataRequest.auth = "1"
            dataRequest.agree = true
        }
        if(parent) {
            dataRequest.parent = parent
        }
        const validResult = validateRequestForm(dataRequest)
        if (validResult.is_success) {
            setSubmitting(true);
            const responseData = await submitRequestFormAction(dataRequest, captchaToken)
            setSubmitting(false);
            setCaptchaToken(null);
            if(!responseData.status) {
                newErrors.common = responseData.error;
                setErrors(newErrors);
                return false
            }

            const request: DBQuestion = responseData.data
            if(!user || (user && !isProfile)) {
                router.push('/consultation/' + request.uuid);
            } else {
                if(setPage) setPage(1)
                if(setCurrent) setCurrent(true)
                if(onClose) onClose()
            }

        } else {
            const _errors = validResult.errors
            if(_errors !== null) {
                newErrors.common = "Вы ввели не корректные данные.";
                for (const error of _errors) {
                    if(Object.hasOwn(newErrors, error.field)) {
                        newErrors[error.field] = error.error.join('<br />');
                    }
                }

                setErrors(newErrors);
            }
        }
    };

    const handleSendOtp = async () => {
        if (!isPhoneComplete(phone) || sendingOtp) return;
        if (!executeRecaptcha) {
            setPhoneCommonError("Сервис проверки недоступен. Обновите страницу.");
            return;
        }
        setPhoneError("");
        setPhoneCommonError("");
        setSendingOtp(true);

        let token: string;
        try {
            token = await executeRecaptcha("wizard_phone_otp");
        } catch {
            setSendingOtp(false);
            setPhoneCommonError("Не удалось пройти проверку. Попробуйте позже.");
            return;
        }

        // Single unified call — the server decides register vs login internally.
        const response = await wizardSendOtpAction({ phone, captchaToken: token });
        setSendingOtp(false);

        if (!response.status) {
            const errData = response.data as { code?: string; retryAfterSec?: number } | null;
            const code = errData?.code;

            // Special case: createOtp resend cooldown — the previously issued OTP
            // is still valid. Jump straight to the OTP screen so the user can
            // enter the code they already received.
            if (code === "cooldown") {
                const normalized = normalizePhoneE164(phone);
                if (normalized) {
                    setNormalizedPhone(normalized.e164);
                    setStep("otp");
                    return;
                }
            }

            if (code === "invalid_phone" || code === "phone_required") {
                setPhoneError(response.error || "Введите корректный номер телефона.");
            } else if (code === "phone_blocked") {
                setPhoneCommonError(response.error || "Ваш номер телефона заблокирован. Свяжитесь с тех.поддержкой.");
            } else if (code === "cooldown_5min") {
                setPhoneCommonError(response.error || "Слишком много попыток. Попробуйте через 5 минут.");
            } else if (code === "captcha_failed") {
                setPhoneCommonError(response.error || "Не удалось пройти проверку. Попробуйте снова.");
            } else if (code === "sms_failed") {
                setPhoneCommonError(response.error || "Не удалось отправить SMS. Попробуйте позже.");
            } else if (errData?.retryAfterSec) {
                setPhoneCommonError(`Попробуйте через ${formatRetryAfter(errData.retryAfterSec)}.`);
            } else {
                setPhoneCommonError(response.error || "Не удалось отправить код.");
            }
            return;
        }

        const data = response.data as {
            phone: string;
            expiresInSec: number;
            devCode?: string;
            isLogin?: boolean;
        };
        setNormalizedPhone(data.phone);
        if (data.devCode) {
            console.info("[DEV] OTP code:", data.devCode);
            setOtpDevCode(data.devCode);
        } else {
            setOtpDevCode(undefined);
        }
        setStep("otp");
    };

    const handleOtpVerify = async (code: string): Promise<OtpStepResult> => {
        // Unified wizard verify-otp: server doesn't create users for the wizard
        // and tells us whether this is an existing user (isLogin) or new phone.
        const response = await wizardVerifyOtpAction({ phone: normalizedPhone, code });
        if (!response.status) {
            const errData = response.data as
                | { cooldownUntil?: string | null; lockedUntil?: string | null; attemptsLeft?: number | null }
                | null;
            return {
                ok: false,
                message: response.error,
                cooldownUntil: errData?.cooldownUntil ?? null,
                lockedUntil: errData?.lockedUntil ?? null,
                attemptsLeft: errData?.attemptsLeft ?? null,
            };
        }
        const data = response.data as {
            phone: string;
            verifyToken: string;
            user?: { id: number; name: string; email: string } | null;
            isFirstQuestionFree?: boolean;
            questionPrice?: number;
            userBalance?: number;
        };

        // Keep verifyToken alive — we'll consume it later, either via signIn
        // (when user is already in DB with full profile) or via signIn after
        // profile-save creates/updates the user.
        setVerifyToken(data.verifyToken);
        setIsFirstQuestionFree(data.isFirstQuestionFree ?? false);
        if (typeof data.questionPrice === "number") setQuestionPrice(data.questionPrice);
        if (typeof data.userBalance === "number") setUserBalance(data.userBalance);

        const user = data.user ?? null;
        if (user) {
            setVerifiedUser(user);
            setFormData((prev) => ({
                ...prev,
                name: user.name ?? prev.name,
                email: user.email ?? prev.email,
            }));
        } else {
            setVerifiedUser(null);
        }

        // If profile is already complete — sign in now and skip profile step.
        if (!needsProfileCompletion(user)) {
            const signInResult = await signInWithPhoneOtp(data.phone, data.verifyToken);
            if (!signInResult.status) {
                return { ok: false, message: signInResult.error || "Ошибка авторизации. Попробуйте позже." };
            }
            // First question free → create the question now and jump to success.
            if (data.isFirstQuestionFree) {
                const submit = await submitFreeAndShowSuccess();
                if (!submit.ok) {
                    return { ok: false, message: submit.message };
                }
                return { ok: true };
            }
            setStep("payment");
            return { ok: true };
        }

        // Otherwise show profile step; signIn will happen after profile-save.
        setStep("profile");
        return { ok: true };
    };

    const handleOtpResend = async (): Promise<OtpStepResult> => {
        if (!executeRecaptcha) {
            return { ok: false, message: "Сервис проверки недоступен. Обновите страницу." };
        }
        let token: string;
        try {
            token = await executeRecaptcha("wizard_phone_otp");
        } catch {
            return { ok: false, message: "Не удалось пройти проверку. Попробуйте позже." };
        }
        const response = await wizardSendOtpAction({ phone: normalizedPhone, captchaToken: token });
        if (!response.status) {
            const errData = response.data as
                | { code?: string; cooldownUntil?: string | null; lockedUntil?: string | null }
                | null;
            return {
                ok: false,
                message: response.error,
                cooldownUntil: errData?.cooldownUntil ?? null,
                lockedUntil: errData?.lockedUntil ?? null,
            };
        }
        const data = response.data as {
            phone: string;
            expiresInSec: number;
            devCode?: string;
            isLogin?: boolean;
        };
        if (data.devCode) {
            console.info("[DEV] OTP code:", data.devCode);
            setOtpDevCode(data.devCode);
        }
        return { ok: true, devCode: data.devCode };
    };

    const goToMyQuestions = () => {
        router.push("/profile?tab=questions");
        if (onClose) onClose();
    };

    /**
     * Creates a question marked as "free" (first-question benefit) and
     * advances the wizard to the success step. Used both when the profile
     * step is skipped (user already has full data) and after profile-save.
     */
    const submitFreeAndShowSuccess = async (): Promise<{ ok: boolean; message?: string }> => {
        const response = await wizardSubmitQuestionAction({
            question: formData.question.trim(),
            paymentMethod: "free",
        });
        if (!response.status) {
            return { ok: false, message: response.error || "Не удалось сохранить вопрос." };
        }
        setSuccessPaid(true);
        setStep("success");
        return { ok: true };
    };

    const handlePayCard = async (): Promise<{ ok: boolean; message?: string }> => {
        const response = await createWizardCardOrderAction(questionPrice, formData.question.trim());
        if (!response.status) {
            return { ok: false, message: response.error || "Не удалось создать платёж." };
        }
        const order = response.data as { alpha_form_url?: string };
        if (!order.alpha_form_url) {
            return { ok: false, message: "Платёжная форма недоступна." };
        }
        // Redirect to Alfa's payment form. Question is created after the
        // callback (out of scope for task 5).
        window.location.href = order.alpha_form_url;
        return { ok: true };
    };

    const handlePayBalance = async (): Promise<{ ok: boolean; message?: string }> => {
        const response = await payWithBalanceAction({
            question: formData.question.trim(),
            idempotencyKey: paymentIdempotencyKey,
        });
        if (!response.status) {
            return { ok: false, message: response.error || "Не удалось провести оплату с баланса." };
        }
        // Server has already charged, created the question (InProgress) and
        // linked the order. From the wizard's POV this is final.
        setSuccessPaid(true);
        setStep("success");
        return { ok: true };
    };

    const handlePayLater = async (): Promise<{ ok: boolean; message?: string }> => {
        const response = await wizardSubmitQuestionAction({
            question: formData.question.trim(),
            paymentMethod: "later",
        });
        if (!response.status) {
            return { ok: false, message: response.error || "Не удалось сохранить вопрос." };
        }
        setSuccessPaid(false);
        setStep("success");
        return { ok: true };
    };

    const handleTopUpBalance = () => {
        // Existing UI in /profile?tab=balance handles the actual top-up flow.
        router.push("/profile?tab=balance");
    };

    const handleProfileSubmit = async (name: string, email: string): Promise<CompleteProfileResult> => {
        // The complete-profile endpoint creates (new wizard user) or updates
        // (existing user with placeholder profile) and authenticates via the
        // verifyToken we received from verify-otp.
        const response = await completeProfileAction({
            name,
            email,
            phone: normalizedPhone,
            verifyToken,
        });
        if (!response.status) {
            return { ok: false, message: response.error };
        }
        const data = response.data as {
            user?: { id: number; name: string; email: string };
            verificationEmailSent?: boolean;
            isFirstQuestionFree?: boolean;
            questionPrice?: number;
            userBalance?: number;
        };
        if (data.user) {
            setVerifiedUser(data.user);
            setFormData((prev) => ({ ...prev, name: data.user!.name, email: data.user!.email }));
        }
        // Pick up the (potentially refreshed) free-question flag from the
        // save response: this is authoritative for users who were just created.
        if (typeof data.isFirstQuestionFree === "boolean") {
            setIsFirstQuestionFree(data.isFirstQuestionFree);
        }
        if (typeof data.questionPrice === "number") setQuestionPrice(data.questionPrice);
        if (typeof data.userBalance === "number") setUserBalance(data.userBalance);
        // User is now in the DB — sign in via NextAuth so subsequent steps
        // (payment, balance, question submit) have a session.
        const signInResult = await signInWithPhoneOtp(normalizedPhone, verifyToken);
        if (!signInResult.status) {
            return { ok: false, message: signInResult.error || "Ошибка авторизации. Попробуйте позже." };
        }
        return { ok: true, verificationEmailSent: data.verificationEmailSent };
    };

    // Follow-up flow (used inside CaseModal): single-step, keep existing submission.
    if (parent) {
        const questionError = validateQuestionText(formData.question);
        const canSubmitFollowUp = !questionError && !!captchaToken && !submitting;

        return (
            <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {errors.common && (
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                            {errors.common}
                        </p>
                    )}

                    <div>
                        <label htmlFor="question" className="block text-sm font-medium text-white/90 mb-2">Описание проблемы</label>
                        <textarea
                            id="question"
                            name="question"
                            rows={6}
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            onBlur={() => setQuestionTouched(true)}
                            placeholder="Опишите вашу ситуацию"
                            className={cn(
                                "w-full px-5 py-4 bg-transparent border-2 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors resize-none",
                                questionTouched && questionError
                                    ? "border-red-400 focus:border-red-500"
                                    : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                            )}
                            required
                        />
                        <div className="flex items-center justify-between text-[12px] mt-1 ml-[4px]">
                            <span className={cn("text-red-400", (!questionTouched || !questionError) && "invisible")}>
                                {questionError ?? " "}
                            </span>
                            <span className={cn("tabular-nums", formData.question.length > QUESTION_MAX_LENGTH ? "text-red-400" : "text-white/60")}>
                                {formData.question.length} / {QUESTION_MAX_LENGTH}
                            </span>
                        </div>
                    </div>

                    <div>
                        <RecaptchaCheckbox
                            action="submit_question"
                            token={captchaToken}
                            onChange={setCaptchaToken}
                            disabled={submitting}
                        />
                    </div>

                    <button type="submit"
                        disabled={!canSubmitFollowUp}
                        className={`w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg ${
                            !canSubmitFollowUp
                                ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
                                : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
                        }`}
                    >{submitting ? "Отправляем…" : "Отправить"}</button>
                </form>
            </div>
        );
    }

    // Main wizard — step 1: question + captcha + agree
    if (step === "question") {
        const questionError = validateQuestionText(formData.question);
        const isCaptchaValid = !!captchaToken;
        const isAgreed = formData.agree === true;
        const canProceed = !questionError && isCaptchaValid && isAgreed && !submitting;

        const handleNext = () => {
            setQuestionTouched(true);
            const err = validateQuestionText(formData.question);
            if (err || !isCaptchaValid || !isAgreed) return;
            setStep("phone");
        };

        return (
            <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
                <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Задать вопрос юристу</h2>
                    <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-[#323c54] text-sm sm:text-base font-medium">ОНЛАЙН</span>
                    </div>
                </div>

                <p className="text-white/80 text-sm leading-relaxed mb-5 sm:mb-6">
                    Опишите проблему → Получите бесплатный анализ ситуации и варианты решений от юриста. Если потребуется подготовка документов или представительство в суде, вы обсудите условия напрямую со специалистом.
                </p>

                {errors.common && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px] mb-2">
                        {errors.common}
                    </p>
                )}

                {/* Скрытое поле "Категория" — логика сохранена (formData.topic), UI не отображается */}
                <div className="hidden" aria-hidden="true">
                    <Select name="topic" aria-label="topic" onValueChange={(value) => setFormData({ ...formData, topic: value })}>
                        <SelectTrigger className="SelectTrigger">
                            <SelectValue placeholder="Выберите тему вопроса…" />
                        </SelectTrigger>
                        <SelectContent className="SelectContent">
                            <SelectGroup>
                                <SelectLabel className="SelectLabel">Недвижимость</SelectLabel>
                                <SelectCategories />
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-5">
                    <div>
                        <div
                            className="rounded-2xl p-3 border-2 border-transparent"
                            style={{ backgroundColor: FIELD_BG }}
                        >
                            <textarea
                                id="question"
                                name="question"
                                rows={6}
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                onBlur={() => setQuestionTouched(true)}
                                placeholder="Опишите вашу ситуацию"
                                aria-invalid={questionTouched && !!questionError}
                                className="w-full min-h-[150px] resize-none bg-transparent border-0 px-2 py-1 text-base text-white placeholder:text-white/60 focus:outline-none focus:ring-0"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between text-[12px] mt-2 px-1">
                            <span className={cn("text-red-300", (!questionTouched || !questionError) && "invisible")}>
                                {questionError ?? " "}
                            </span>
                            <span className={cn(
                                "tabular-nums",
                                formData.question.length > QUESTION_MAX_LENGTH ? "text-red-300" : "text-white/60"
                            )}>
                                {formData.question.length} / {QUESTION_MAX_LENGTH}
                            </span>
                        </div>
                    </div>

                    <RecaptchaCheckbox
                        action="submit_question"
                        token={captchaToken}
                        onChange={setCaptchaToken}
                        disabled={submitting}
                    />

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed}
                        className={cn(
                            "w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg",
                            !canProceed
                                ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
                                : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
                        )}
                        style={canProceed ? { backgroundColor: BRAND } : undefined}
                    >
                        Далее
                    </button>

                    <div className="flex items-start gap-3 text-xs text-white/70 leading-relaxed pt-1">
                        <button
                            type="button"
                            role="checkbox"
                            id="agree"
                            aria-checked={formData.agree}
                            onClick={() => setFormData({ ...formData, agree: !formData.agree })}
                            className={cn(
                                "mt-0.5 w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer",
                                formData.agree
                                    ? "bg-white border-white"
                                    : "bg-transparent border-white/60"
                            )}
                        >
                            {formData.agree && <Check className="w-3.5 h-3.5 text-[#3d4b5e] pointer-events-none" strokeWidth={3} />}
                        </button>
                        <span>
                            Согласен с{" "}
                            <a href="/terms" className="underline hover:text-white">Условиями обработки персональных данных</a>{" "}
                            и{" "}
                            <a href="/terms" className="underline hover:text-white">Пользовательским соглашением</a>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: phone input + send-otp
    if (step === "phone") {
        const phoneValid = isPhoneComplete(phone);
        const canRequestCode = phoneValid && !sendingOtp;

        return (
            <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Введите телефон</h2>
                <p className="text-white/80 text-sm leading-relaxed mb-5 sm:mb-6">
                    Отправим SMS-код для подтверждения номера и безопасного доступа к вашему обращению.
                </p>

                {phoneCommonError && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/40 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-px" />
                        <p className="text-sm text-red-200">{phoneCommonError}</p>
                    </div>
                )}

                <div className="space-y-5">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                            Номер телефона
                        </label>
                        <div
                            className={cn(
                                "rounded-2xl p-3 border-2",
                                phoneError ? "border-red-400/60" : "border-transparent"
                            )}
                            style={{ backgroundColor: FIELD_BG }}
                        >
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                autoFocus
                                value={phone}
                                onChange={(e) => {
                                    const formatted = formatPhoneInput(e.target.value);
                                    setPhone(formatted);
                                    setPhoneError(
                                        !formatted || isPhoneComplete(formatted)
                                            ? ""
                                            : "Введите корректный номер телефона"
                                    );
                                    setPhoneCommonError("");
                                }}
                                placeholder={PHONE_MASK_TEMPLATE}
                                aria-invalid={!!phoneError}
                                className="w-full bg-transparent border-0 px-2 py-1 text-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-0 tabular-nums"
                            />
                        </div>
                        {phoneError && (
                            <p className="text-[12px] text-red-300 mt-2 ml-1">{phoneError}</p>
                        )}
                        <p className="text-[12px] text-white/60 mt-3 ml-1">
                            Нажимая «Получить код», вы соглашаетесь с условиями обработки данных.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={!canRequestCode}
                        className={cn(
                            "w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg",
                            !canRequestCode
                                ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
                                : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
                        )}
                        style={canRequestCode ? { backgroundColor: BRAND } : undefined}
                    >
                        {sendingOtp ? "Отправляем…" : "Получить код"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setPhoneError("");
                            setPhoneCommonError("");
                            setStep("question");
                        }}
                        className="flex items-center justify-center gap-2 w-full text-sm text-white/70 hover:text-white transition-colors py-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </div>
            </div>
        );
    }

    // Step 3: OTP verification
    if (step === "otp") {
        return (
            <RequestStepOtp
                phone={normalizedPhone}
                initialDevCode={otpDevCode}
                onChangePhone={() => setStep("phone")}
                onVerify={handleOtpVerify}
                onResend={handleOtpResend}
            />
        );
    }

    // Step 4: complete profile (name + email) — shown only if the user lacks real data
    if (step === "profile") {
        const placeholderName = normalizedPhone ? phoneToDefaultName(normalizedPhone) : null;
        const initialName = verifiedUser?.name && verifiedUser.name !== placeholderName
            ? verifiedUser.name
            : "";
        const initialEmail = verifiedUser?.email && !isPhoneEmail(verifiedUser.email)
            ? verifiedUser.email
            : "";
        return (
            <RequestStepProfile
                initialName={initialName}
                initialEmail={initialEmail}
                onSubmit={handleProfileSubmit}
                onContinue={() => {
                    if (isFirstQuestionFree) {
                        void submitFreeAndShowSuccess();
                    } else {
                        setStep("payment");
                    }
                }}
            />
        );
    }

    // Step 5: payment (only for paid questions — free ones go straight to success)
    if (step === "payment") {
        return (
            <RequestStepPayment
                price={questionPrice}
                balance={userBalance}
                onPayCard={handlePayCard}
                onPayBalance={handlePayBalance}
                onPayLater={handlePayLater}
                onTopUp={handleTopUpBalance}
            />
        );
    }

    // Step 6: success — reached after free submit, paid balance/card payment,
    // or "оплатить позже" (with paid=false).
    if (step === "success") {
        return <RequestStepSuccess paid={successPaid} onGoToProfile={goToMyQuestions} />;
    }

    // Safety net for any unhandled step.
    return null;
}
