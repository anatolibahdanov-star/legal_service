import { Dispatch, SetStateAction, useRef, useState } from "react";
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
import { YandexSmartCaptcha } from "@/src/app/components/forms/YandexSmartCaptcha";
import { useYandexInvisibleCaptcha } from "@/src/app/components/forms/useYandexInvisibleCaptcha";
import RequestStepOtp, { OtpStepResult } from "@/src/app/components/forms/RequestStepOtp";
import RequestStepProfile, { CompleteProfileResult } from "@/src/app/components/forms/RequestStepProfile";
import RequestStepPayment from "@/src/app/components/forms/RequestStepPayment";
import RequestStepSuccess from "@/src/app/components/forms/RequestStepSuccess";
import RequestStepError from "@/src/app/components/forms/RequestStepError";
import { completeProfileAction } from "@/src/app/components/forms/action/complete-profile";
import {
  wizardAuthInitAction,
  wizardSendOtpAction,
  wizardVerifyOtpAction,
  wizardCreateQuestionAction,
  wizardUpdateQuestionTextAction,
  wizardSubmitQuestionAction,
  createWizardCardOrderAction,
  payWithBalanceAction,
} from "@/src/app/components/forms/action/wizard";
import { needsProfileCompletion, isPhoneEmail, phoneToDefaultName, normalizePhoneE164 } from "@/src/libs/phoneIdentity";
import { emitBalanceRefresh } from "@/src/libs/balanceEvents";
import { cn } from "@/src/app/components/ui/utils";

interface RequestFormOptionsI {
    parent?: number|null;
    setCurrent?: Dispatch<SetStateAction<boolean>>;
    setPage?: (page: number) => void;
    onClose?: () => void;
    isProfile?: boolean;
}

const BRAND = "#8faaba";
const FIELD_BG = "rgba(143, 170, 186, 0.18)";

type WizardStep = "question" | "phone" | "otp" | "profile" | "payment" | "success" | "error";

/** Discriminates success-screen variants — drives copy + icon + amount. */
type SuccessKind = "free" | "balance" | "card" | "later";

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
    const { execute: executeCaptcha } = useYandexInvisibleCaptcha({ variant: "dark" });
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
    /** Controls the success-step copy/icon. */
    const [successKind, setSuccessKind] = useState<SuccessKind>("free");
    /** Charged/paid amount shown on the success screen for balance/card. */
    const [successAmount, setSuccessAmount] = useState<number>(0);
    /**
     * Id+uuid of the Unpaid question created on Step 3 (after signIn).
     * Step 5 uses this — it never creates a new question.
     */
    // Хранится в ref-ах, а не useState, потому что в одном тике (handleNextAuthed)
    // ensureUnpaidQuestionExists вызывается дважды подряд — сначала на шаге 705
    // и потом изнутри handlePayBalance/submitFreeAndShowSuccess. setState
    // асинхронен и не виден в замыкании повторного вызова, поэтому второй вызов
    // видел null и создавал дубликат вопроса. Refs обновляются синхронно.
    const questionIdRef = useRef<string | number | null>(null);
    const questionUuidRef = useRef<string | null>(null);
    const committedQuestionTextRef = useRef<string>("");
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
                if(setCurrent) setCurrent(prev => !prev)
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
        setPhoneError("");
        setPhoneCommonError("");
        setSendingOtp(true);

        let token: string;
        try {
            token = await executeCaptcha();
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
            // Step 3 → Unpaid question is created right after the phone-bound
            // session is established. Step 5 will only flip its status.
            const ensured = await ensureUnpaidQuestionExists();
            if (!ensured.ok) {
                return { ok: false, message: ensured.message };
            }
            // First question free → flip status to InProgress and jump to success.
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
        let token: string;
        try {
            token = await executeCaptcha();
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
        if (onClose) onClose();
        // Hard-navigation + сохранение locale-префикса: см. handleTopUpBalance —
        // Profile.tsx читает ?tab= один раз в useState-инициализаторе, soft-push
        // на тот же путь не переключит вкладку, а валидные значения таба —
        // "account" | "cases" | "balance" (Profile.tsx:623-628).
        if (typeof window !== "undefined") {
            const path = window.location.pathname.replace(/\/$/, "") || "";
            const profileBase = path.match(/^(.*?\/profile)(\/.*)?$/);
            const localeMatch = path.match(/^(\/[^/]+)/);
            const target = profileBase
                ? profileBase[1]
                : localeMatch
                    ? `${localeMatch[1]}/profile`
                    : "/profile";
            window.location.assign(`${target}?tab=cases`);
        }
    };

    /**
     * Ensures an Unpaid question exists for this wizard session, creating
     * it on the server if needed. Should be called right after signIn
     * (either after OTP for existing users, or after profile-save for new
     * ones, or on "Далее" for already-authed LK users). Идемпотентность на
     * клиенте через refs (см. комментарий у questionIdRef).
     *
     * Handles back-navigation drift: if the user has gone back to Step 1
     * and edited the text after the Unpaid row was already created, the
     * row is PATCHed in place rather than left stale (or duplicated).
     */
    const ensureUnpaidQuestionExists = async (): Promise<
        { ok: true; id: string | number; uuid: string } | { ok: false; message: string }
    > => {
        const currentText = formData.question.trim();
        const existingId = questionIdRef.current;
        if (existingId !== null) {
            if (currentText === committedQuestionTextRef.current) {
                return { ok: true, id: existingId, uuid: questionUuidRef.current ?? "" };
            }
            const patch = await wizardUpdateQuestionTextAction(existingId, currentText);
            if (!patch.status) {
                // If the row is no longer Unpaid (server returned 409),
                // the original question already moved past Unpaid — don't
                // silently overwrite, just fall through with the existing id.
                return {
                    ok: false,
                    message: patch.error || "Не удалось обновить текст вопроса.",
                };
            }
            committedQuestionTextRef.current = currentText;
            return { ok: true, id: existingId, uuid: questionUuidRef.current ?? "" };
        }
        const response = await wizardCreateQuestionAction(currentText);
        if (!response.status) {
            return { ok: false, message: response.error || "Не удалось сохранить вопрос." };
        }
        const data = response.data as { question?: { id?: string | number; uuid?: string } };
        const created = data?.question;
        if (!created?.id) {
            return { ok: false, message: "Не удалось сохранить вопрос." };
        }
        questionIdRef.current = created.id;
        questionUuidRef.current = created.uuid ?? null;
        committedQuestionTextRef.current = currentText;
        return { ok: true, id: created.id, uuid: created.uuid ?? "" };
    };

    /**
     * Finalizes a free question (first-question benefit): flips the
     * existing Unpaid row to InProgress. Used both when the profile step
     * is skipped (user already has full data) and after profile-save.
     */
    const submitFreeAndShowSuccess = async (): Promise<{ ok: boolean; message?: string }> => {
        const ensured = await ensureUnpaidQuestionExists();
        if (!ensured.ok) return { ok: false, message: ensured.message };
        const response = await wizardSubmitQuestionAction({
            questionId: ensured.id,
            paymentMethod: "free",
        });
        if (!response.status) {
            return { ok: false, message: response.error || "Не удалось сохранить вопрос." };
        }
        setSuccessKind("free");
        setSuccessAmount(0);
        setStep("success");
        return { ok: true };
    };

    const handlePayCard = async (): Promise<{ ok: boolean; message?: string }> => {
        const ensured = await ensureUnpaidQuestionExists();
        if (!ensured.ok) {
            showPaymentError(ensured.message);
            return { ok: false, message: ensured.message };
        }
        const response = await createWizardCardOrderAction(questionPrice, ensured.id);
        if (!response.status) {
            const msg = response.error || "Не удалось создать платёж.";
            showPaymentError(msg);
            return { ok: false, message: msg };
        }
        const order = response.data as { alpha_form_url?: string };
        if (!order.alpha_form_url) {
            const msg = "Платёжная форма недоступна.";
            showPaymentError(msg);
            return { ok: false, message: msg };
        }
        // Redirect to Alfa's payment form. The question status remains
        // Unpaid until /api/status callback confirms the Alfa payment;
        // at that point the order service flips it to InProgress.
        window.location.href = order.alpha_form_url;
        return { ok: true };
    };

    const handlePayBalance = async (): Promise<{ ok: boolean; message?: string }> => {
        const ensured = await ensureUnpaidQuestionExists();
        if (!ensured.ok) {
            showPaymentError(ensured.message);
            return { ok: false, message: ensured.message };
        }
        const response = await payWithBalanceAction({
            questionId: ensured.id,
            idempotencyKey: paymentIdempotencyKey,
            source: isProfile ? 'lk' : 'main',
        });
        if (!response.status) {
            const msg = response.error || "Не удалось провести оплату с баланса.";
            showPaymentError(msg);
            return { ok: false, message: msg };
        }
        const data = response.data as { amount?: number };
        setSuccessKind("balance");
        setSuccessAmount(typeof data?.amount === "number" ? data.amount : questionPrice);
        emitBalanceRefresh();
        setStep("success");
        return { ok: true };
    };

    const handlePayLater = async (): Promise<{ ok: boolean; message?: string }> => {
        const ensured = await ensureUnpaidQuestionExists();
        if (!ensured.ok) return { ok: false, message: ensured.message };
        const response = await wizardSubmitQuestionAction({
            questionId: ensured.id,
            paymentMethod: "later",
        });
        if (!response.status) {
            return { ok: false, message: response.error || "Не удалось сохранить вопрос." };
        }
        setSuccessKind("later");
        setSuccessAmount(0);
        setStep("success");
        return { ok: true };
    };

    /**
     * Switches the wizard to the error screen. The question itself is
     * left as Unpaid — the user can retry from their LK. The error
     * `message` is logged for diagnostics but not shown in the UI per
     * the spec (the error screen is intentionally indistinguishable in
     * copy from the "оплатить позже" success screen).
     */
    const showPaymentError = (message: string) => {
        console.warn("[wizard] payment failed:", message);
        setStep("error");
    };

    const handleTopUpBalance = () => {
        // Hard-navigation вместо router.push: Profile.tsx читает ?tab= один
        // раз в useState-инициализаторе, поэтому soft-навигация по тому же
        // пути не переключит таб.
        // Если визард в попапе ЛК — сперва закрываем модалку.
        if (onClose) onClose();
        // Сохраняем текущую locale-префиксную базу пути (например, /ru/profile),
        // иначе уйдём на «голый» /profile, который не матчится с [locale]/profile.
        if (typeof window !== "undefined") {
            const path = window.location.pathname.replace(/\/$/, "") || "";
            const profileBase = path.match(/^(.*?\/profile)(\/.*)?$/);
            const target = profileBase ? profileBase[1] : "/profile";
            window.location.assign(`${target}?tab=balance`);
        }
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
        // For new users, this is the point that satisfies the "Step 3 —
        // after phone confirmation" requirement: the session exists, so
        // the Unpaid question can be persisted before the payment step.
        const ensured = await ensureUnpaidQuestionExists();
        if (!ensured.ok) {
            return { ok: false, message: ensured.message };
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

                    <YandexSmartCaptcha
                        token={captchaToken}
                        onChange={setCaptchaToken}
                        disabled={submitting}
                        variant="dark"
                        fullWidth
                    />

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

    // Main wizard — step 1: question + (captcha for guests) + agree
    if (step === "question") {
        const questionError = validateQuestionText(formData.question);
        const isAuthed = !!user;
        // Captcha is only required for guests; authed users have already
        // proven themselves via the existing session.
        const isCaptchaValid = isAuthed || !!captchaToken;
        const isAgreed = formData.agree === true;
        const canProceed = !questionError && isCaptchaValid && isAgreed && !submitting;

        const handleNext = () => {
            setQuestionTouched(true);
            const err = validateQuestionText(formData.question);
            if (err || !isCaptchaValid || !isAgreed) return;
            setStep("phone");
        };

        /**
         * Authed-user branch: skip phone/OTP/profile and decide payment
         * straight from step 1. We re-fetch init data on submit so the
         * balance check uses fresh server state, not whatever was loaded
         * on mount.
         */
        const handleNextAuthed = async () => {
            setQuestionTouched(true);
            const err = validateQuestionText(formData.question);
            if (err || !isAgreed || submitting) return;

            setSubmitting(true);
            setErrors((prev) => ({ ...prev, common: "" }));
            try {
                const initResponse = await wizardAuthInitAction();
                if (!initResponse.status) {
                    setErrors((prev) => ({
                        ...prev,
                        common: initResponse.error || "Не удалось получить данные пользователя. Попробуйте позже.",
                    }));
                    return;
                }
                const initData = initResponse.data as {
                    isFirstQuestionFree?: boolean;
                    questionPrice?: number;
                    userBalance?: number;
                };
                const isFirstFree = !!initData.isFirstQuestionFree;
                const price = typeof initData.questionPrice === "number" ? initData.questionPrice : 0;
                const balance = typeof initData.userBalance === "number" ? initData.userBalance : 0;

                // Surface the fresh numbers so Step 5 renders correctly if
                // we end up falling through to it.
                setIsFirstQuestionFree(isFirstFree);
                setQuestionPrice(price);
                setUserBalance(balance);

                // LK-side equivalent of "Step 3 after phone confirmation":
                // the user is already authenticated, so once they commit to
                // submitting we persist the Unpaid question now.
                const ensured = await ensureUnpaidQuestionExists();
                if (!ensured.ok) {
                    setErrors((prev) => ({
                        ...prev,
                        common: ensured.message || "Не удалось сохранить вопрос.",
                    }));
                    return;
                }

                if (isFirstFree) {
                    const r = await submitFreeAndShowSuccess();
                    if (!r.ok) {
                        setErrors((prev) => ({
                            ...prev,
                            common: r.message || "Не удалось сохранить вопрос.",
                        }));
                    }
                    return;
                }

                if (balance >= price) {
                    const r = await handlePayBalance();
                    if (!r.ok) {
                        // Balance dropped between init and pay (or other
                        // failure). Fall back to the payment step so the
                        // user can pick another method.
                        setErrors((prev) => ({
                            ...prev,
                            common: r.message || "Не удалось списать с баланса. Выберите способ оплаты.",
                        }));
                        setStep("payment");
                    }
                    return;
                }

                // Balance < price → let the user pick card / top-up / pay-later.
                setStep("payment");
            } finally {
                setSubmitting(false);
            }
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

                    {!isAuthed && (
                        <YandexSmartCaptcha
                            token={captchaToken}
                            onChange={setCaptchaToken}
                            disabled={submitting}
                            variant="dark"
                            fullWidth
                        />
                    )}

                    <button
                        type="button"
                        onClick={isAuthed ? handleNextAuthed : handleNext}
                        disabled={!canProceed}
                        className={cn(
                            "w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg",
                            !canProceed
                                ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
                                : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
                        )}
                        style={canProceed ? { backgroundColor: BRAND } : undefined}
                    >
                        {submitting ? "Обрабатываем…" : "Далее"}
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
                        // Если сервер откажет в free-бенефите (рассинхрон стейта
                        // и серверного флага) — не оставляем юзера в тупике,
                        // отправляем на шаг выбора оплаты.
                        submitFreeAndShowSuccess().then((r) => {
                            if (!r.ok) setStep("payment");
                        });
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
    // or "оплатить позже". `successKind` drives the copy + icon + amount.
    if (step === "success") {
        return (
            <RequestStepSuccess
                variant={successKind}
                amount={successAmount}
                onGoToProfile={goToMyQuestions}
            />
        );
    }

    // Step 7: payment error — question stays Unpaid; user is sent to LK
    // to retry from there (single-button screen per spec).
    if (step === "error") {
        return (
            <RequestStepError onGoToProfile={goToMyQuestions} />
        );
    }

    // Safety net for any unhandled step.
    return null;
}
