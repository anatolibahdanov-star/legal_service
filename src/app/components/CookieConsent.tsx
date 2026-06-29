"use client";

import { useState, useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import { PdfDocumentModal } from "@/src/app/components/PdfDocumentModal";
import { LEGAL_DOCUMENTS } from "@/src/app/components/legalDocuments";

const COOKIE_NAME = "enki_cookie_consent";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

const readConsentCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  const prefix = `${COOKIE_NAME}=`;
  const found = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
};

const writeConsentCookie = (value: string) => {
  if (typeof document === "undefined") return;
  const isHttps = typeof location !== "undefined" && location.protocol === "https:";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${COOKIE_MAX_AGE_SEC}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (isHttps) parts.push("Secure");
  document.cookie = parts.join("; ");
};

const noopSubscribe = () => () => {};
const getConsentSnapshot = () => readConsentCookie();
// Non-null on the server keeps the banner hidden during SSR and hydration,
// avoiding both hydration mismatch and a flash for returning users.
const getConsentServerSnapshot = () => "ssr";

export function CookieConsent() {
  const consent = useSyncExternalStore(
    noopSubscribe,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const [accepted, setAccepted] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  const accept = () => {
    writeConsentCookie(new Date().toISOString());
    setAccepted(true);
  };

  if (consent !== null || accepted) return null;

  return (
    <>
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Уведомление об использовании cookies"
        className="fixed inset-x-4 bottom-4 z-[900] mx-auto max-w-3xl rounded-2xl bg-[#12161B] text-white shadow-2xl border border-white/10"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-[#34347C] shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-white/90">
              Мы используем файлы cookies и рекомендательные технологии для
              работы сайта, анализа поведения пользователей и улучшения сервиса.
              Подробнее см.{" "}
              <button
                type="button"
                onClick={() => setShowDoc(true)}
                className="underline underline-offset-2 text-white hover:text-white/80"
              >
                Рекомендательные технологии
              </button>
              . Продолжая использовать сайт, вы соглашаетесь с этими условиями.
            </p>
          </div>
          <button
            type="button"
            onClick={accept}
            className="shrink-0 self-stretch sm:self-auto rounded-xl bg-[#34347C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2a2a66] transition-colors"
          >
            Принять
          </button>
        </div>
      </div>

      <PdfDocumentModal
        open={showDoc}
        title={LEGAL_DOCUMENTS["recommendation-technologies"].title}
        src={LEGAL_DOCUMENTS["recommendation-technologies"].src}
        onClose={() => setShowDoc(false)}
      />
    </>
  );
}
