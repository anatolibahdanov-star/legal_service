"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Wallet } from "lucide-react";
import { CustomGetRequest } from "@/src/libs/request";
import { subscribeBalanceRefresh } from "@/src/libs/balanceEvents";

type BalanceState =
  | { status: "loading" }
  | { status: "ready"; balance: number; freeQuestions: number }
  | { status: "error" };

const readFreeQuestions = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const formatRub = (value: number): string =>
  new Intl.NumberFormat("ru-RU").format(value);

/**
 * Header chip showing the signed-in user's balance. Hidden for guests and
 * non-`user` roles (admins / lawyers don't have a balance). The whole chip
 * is a link to the balance tab in the profile, and it auto-refetches when
 * `emitBalanceRefresh()` fires after a top-up or charge.
 */
export default function HeaderBalance() {
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<BalanceState>({ status: "loading" });

  const isUser = sessionStatus === "authenticated" && session?.user?.role === "user";

  const fetchBalance = useCallback(async () => {
    const res = await CustomGetRequest("/users/me/balance");
    if (!res.status || typeof res.data?.balance !== "number") {
      setState({ status: "error" });
      return;
    }
    setState({ status: "ready", balance: res.data.balance, freeQuestions: readFreeQuestions(res.data.freeQuestions) });
  }, []);

  useEffect(() => {
    if (!isUser) return;
    let cancelled = false;
    (async () => {
      const res = await CustomGetRequest("/users/me/balance");
      if (cancelled) return;
      if (!res.status || typeof res.data?.balance !== "number") {
        setState({ status: "error" });
        return;
      }
      setState({ status: "ready", balance: res.data.balance, freeQuestions: readFreeQuestions(res.data.freeQuestions) });
    })();
    return () => {
      cancelled = true;
    };
  }, [isUser]);

  useEffect(() => {
    if (!isUser) return;
    return subscribeBalanceRefresh(() => {
      void fetchBalance();
    });
  }, [isUser, fetchBalance]);

  if (!isUser) return null;
  if (state.status === "error") return null;

  const amountText =
    state.status === "ready" ? `${formatRub(state.balance)} ₽` : "— ₽";
  const isPositive = state.status === "ready" && state.balance > 0;
  const amountColor = isPositive ? "text-[#10b981]" : "text-[#9ca3af]";

  const freeQuestions = state.status === "ready" ? state.freeQuestions : 0;

  return (
    <div className="flex items-center justify-end gap-4 pr-3">
      <Link
        href="/profile/?tab=balance"
        aria-label="Перейти на страницу баланса"
        className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
      >
        <Wallet className={`w-4 h-4 ${isPositive ? "text-[#10b981]" : "text-[#9ca3af]"}`} strokeWidth={2} />
        <span className="text-[#29282b]/70">Баланс:</span>
        <span className={`font-bold tabular-nums ${amountColor}`}>{amountText}</span>
      </Link>
      {freeQuestions > 0 && (
        <Link
          href="/profile/?tab=balance"
          aria-label="Перейти к бесплатным вопросам"
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
        >
          <span className="text-[#29282b]/70">Бесплатные вопросы:</span>
          <span className="font-bold tabular-nums text-[#34347C]">{freeQuestions}</span>
        </Link>
      )}
    </div>
  );
}
