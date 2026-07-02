"use client";

import { useEffect, useState } from "react";
import RequestStepPayment from "@/src/app/components/forms/RequestStepPayment";
import RequestStepSuccess from "@/src/app/components/forms/RequestStepSuccess";
import {
  wizardAuthInitAction,
  createWizardCardOrderAction,
  payWithBalanceAction,
} from "@/src/app/components/forms/action/wizard";
import { emitBalanceRefresh } from "@/src/libs/balanceEvents";

interface PayQuestionWindowProps {
  isOpen: boolean;
  questionId: string | number | null;
  onClose: () => void;
  /** Called once the balance payment succeeded so the list can refetch. */
  onPaid: () => void;
}

/**
 * Modal payment picker for an already-saved Unpaid question (LK «Мои заявки»
 * → кнопка «Оплатить»). Reuses `RequestStepPayment` but skips «оплатить
 * позже» — вопрос уже сохранён.
 *
 * Card-payments redirect to Alfa's form (handled by the parent navigation).
 * Balance-payments resolve in-place: server flips the question Unpaid →
 * InProgress, we emit a balance-refresh event and tell the parent to refetch.
 */
export default function PayQuestionWindow({
  isOpen,
  questionId,
  onClose,
  onPaid,
}: PayQuestionWindowProps) {
  const [price, setPrice] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [freeQuestions, setFreeQuestions] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  /** Сумма списания, чтобы показать её на экране успеха. */
  const [paidAmount, setPaidAmount] = useState<number>(0);
  /** Вопрос покрыт бесплатным — на экране успеха показываем free-вариант. */
  const [paidWithFree, setPaidWithFree] = useState<boolean>(false);
  /** После успешной оплаты с баланса заменяем платёжный экран на success. */
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setPaid(false);
    setPaidAmount(0);
    setPaidWithFree(false);
    setIdempotencyKey(
      `paylist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    );
    (async () => {
      const res = await wizardAuthInitAction();
      if (cancelled) return;
      if (!res.status) {
        setLoadError(res.error || "Не удалось получить данные. Попробуйте позже.");
        setLoading(false);
        return;
      }
      const data = res.data as { questionPrice?: number; userBalance?: number; freeQuestions?: number };
      setPrice(typeof data.questionPrice === "number" ? data.questionPrice : 0);
      setBalance(typeof data.userBalance === "number" ? data.userBalance : 0);
      setFreeQuestions(typeof data.freeQuestions === "number" ? data.freeQuestions : 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayCard = async (): Promise<{ ok: boolean; message?: string }> => {
    if (questionId === null) return { ok: false, message: "Вопрос не выбран." };
    const res = await createWizardCardOrderAction(price, questionId);
    if (!res.status) return { ok: false, message: res.error || "Не удалось создать платёж." };
    const order = res.data as { alpha_form_url?: string };
    if (!order.alpha_form_url) return { ok: false, message: "Платёжная форма недоступна." };
    window.location.href = order.alpha_form_url;
    return { ok: true };
  };

  const handlePayBalance = async (): Promise<{ ok: boolean; message?: string }> => {
    if (questionId === null) return { ok: false, message: "Вопрос не выбран." };
    const res = await payWithBalanceAction({
      questionId,
      idempotencyKey,
      source: "lk",
    });
    if (!res.status) {
      return { ok: false, message: res.error || "Не удалось провести оплату с баланса." };
    }
    const data = res.data as { amount?: number; freeUsed?: boolean } | null;
    const amount = typeof data?.amount === "number" ? data.amount : price;
    emitBalanceRefresh();
    // Список перечитываем уже сейчас, чтобы к моменту закрытия модалки
    // статус в таблице был «В работе».
    onPaid();
    setPaidAmount(amount);
    setPaidWithFree(!!data?.freeUsed);
    setPaid(true);
    return { ok: true };
  };

  // «Оплатить позже» здесь — просто закрытие модалки. Вопрос уже сохранён
  // как Unpaid в таблице, никаких серверных мутаций делать не нужно.
  const handlePayLater = async (): Promise<{ ok: boolean; message?: string }> => {
    onClose();
    return { ok: true };
  };

  const handleTopUp = () => {
    onClose();
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/\/$/, "") || "";
      const profileBase = path.match(/^(.*?\/profile)(\/.*)?$/);
      const target = profileBase ? profileBase[1] : "/profile";
      window.location.assign(`${target}?tab=balance`);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[540px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[20px] right-[20px] text-white/60 hover:text-white transition-colors z-10"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-8 shadow-2xl text-center text-white/80">
            Загружаем…
          </div>
        ) : loadError ? (
          <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-8 shadow-2xl text-center text-red-300">
            {loadError}
          </div>
        ) : paid ? (
          <RequestStepSuccess
            variant={paidWithFree ? "bonus" : "balance"}
            amount={paidAmount}
            onGoToProfile={onClose}
          />
        ) : (
          <RequestStepPayment
            price={price}
            balance={balance}
            freeQuestions={freeQuestions}
            onPayCard={handlePayCard}
            onPayBalance={handlePayBalance}
            onPayLater={handlePayLater}
            onTopUp={handleTopUp}
          />
        )}
      </div>
    </div>
  );
}
