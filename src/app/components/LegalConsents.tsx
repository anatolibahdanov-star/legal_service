"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PdfDocumentModal } from "@/src/app/components/PdfDocumentModal";
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentKey,
} from "@/src/app/components/legalDocuments";

export interface LegalConsentsValue {
  privacy: boolean;
  data: boolean;
  offer: boolean;
}

export const emptyLegalConsents: LegalConsentsValue = {
  privacy: false,
  data: false,
  offer: false,
};

export const allConsentsAccepted = (v: LegalConsentsValue) =>
  v.privacy === true && v.data === true && v.offer === true;

interface CheckboxRowProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Plain-text prefix that sits before the clickable document name. */
  prefix: string;
  /** Clickable substring — the visible name of the document. */
  docLabel: string;
  /** Optional trailing word that follows the link (e.g. "."). */
  suffix?: string;
  docKey: LegalDocumentKey;
  tone: "light" | "dark";
  showError?: boolean;
  errorText?: string;
  onOpenDoc: (key: LegalDocumentKey) => void;
}

function CheckboxRow({
  id,
  checked,
  onChange,
  prefix,
  docLabel,
  suffix,
  docKey,
  tone,
  showError,
  errorText,
  onOpenDoc,
}: CheckboxRowProps) {
  const isDark = tone === "dark";
  const textColor = isDark ? "text-white/90" : "text-[#0F1B2D]";
  const linkColor = isDark
    ? "text-white hover:text-white"
    : "text-[#3B82F6] hover:text-[#2563EB]";
  const boxIdleBorder = isDark ? "border-white/40" : "border-[#9BB7C9]";
  const boxIdleBg = isDark ? "bg-white/5" : "bg-white";
  const boxCheckedBg = isDark ? "bg-[#8faaba] border-[#8faaba]" : "bg-[#5A8FB5] border-[#5A8FB5]";
  const boxErrorBorder = "border-red-400";

  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className={`flex items-start gap-[12px] cursor-pointer group select-none ${textColor}`}
      >
        <span className="relative inline-flex items-center justify-center w-[20px] h-[20px] mt-[1px] shrink-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={[
              "absolute inset-0 rounded-[5px] border-2 transition-colors",
              checked ? boxCheckedBg : `${boxIdleBorder} ${boxIdleBg}`,
              showError && !checked ? boxErrorBorder : "",
            ].join(" ")}
          />
          {checked && (
            <Check
              className="relative w-3.5 h-3.5 text-white pointer-events-none"
              strokeWidth={3.5}
            />
          )}
        </span>
        <span className="text-[14px] leading-[20px] flex-1">
          <span>{prefix} </span>
          <span
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenDoc(docKey);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onOpenDoc(docKey);
              }
            }}
            className={`underline underline-offset-2 decoration-1 cursor-pointer transition-colors ${linkColor}`}
          >
            {docLabel}
          </span>
          {suffix ?? ""}
        </span>
      </label>
      {showError && errorText && (
        <p className="text-[12px] text-red-400 mt-[4px] ml-[32px]">{errorText}</p>
      )}
    </div>
  );
}

interface LegalConsentsProps {
  value: LegalConsentsValue;
  onChange: (next: LegalConsentsValue) => void;
  tone?: "light" | "dark";
  errors?: Partial<Record<keyof LegalConsentsValue, string>>;
  idPrefix?: string;
}

export function LegalConsents({
  value,
  onChange,
  tone = "light",
  errors,
  idPrefix = "consent",
}: LegalConsentsProps) {
  const [openDoc, setOpenDoc] = useState<LegalDocumentKey | null>(null);

  const set = (key: keyof LegalConsentsValue, next: boolean) =>
    onChange({ ...value, [key]: next });

  return (
    <>
      <div className="flex flex-col gap-[12px]">
        <CheckboxRow
          id={`${idPrefix}-privacy`}
          checked={value.privacy}
          onChange={(v) => set("privacy", v)}
          prefix="Согласен с"
          docLabel="Политикой в отношении обработки персональных данных"
          docKey="privacy-policy"
          tone={tone}
          showError={!!errors?.privacy}
          errorText={errors?.privacy}
          onOpenDoc={setOpenDoc}
        />
        <CheckboxRow
          id={`${idPrefix}-data`}
          checked={value.data}
          onChange={(v) => set("data", v)}
          prefix="Подтверждаю свое"
          docLabel="Согласие на обработку персональных данных"
          docKey="personal-data-consent"
          tone={tone}
          showError={!!errors?.data}
          errorText={errors?.data}
          onOpenDoc={setOpenDoc}
        />
        <CheckboxRow
          id={`${idPrefix}-offer`}
          checked={value.offer}
          onChange={(v) => set("offer", v)}
          prefix="Согласен с"
          docLabel="Условиями публичной оферты"
          docKey="public-offer"
          tone={tone}
          showError={!!errors?.offer}
          errorText={errors?.offer}
          onOpenDoc={setOpenDoc}
        />
      </div>

      <PdfDocumentModal
        open={openDoc !== null}
        title={openDoc ? LEGAL_DOCUMENTS[openDoc].title : ""}
        src={openDoc ? LEGAL_DOCUMENTS[openDoc].src : ""}
        onClose={() => setOpenDoc(null)}
      />
    </>
  );
}
