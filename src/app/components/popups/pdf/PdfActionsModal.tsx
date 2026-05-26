"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  MessageSquare,
  Mail,
  Link2,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/app/components/ui/dialog";
import { Button } from "@/src/app/components/ui/button";
import { Input } from "@/src/app/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/app/components/ui/tooltip";
import { cn } from "@/src/app/components/ui/utils";
import { formatPhoneInput, isPhoneComplete } from "@/src/libs/phoneMask";

type DownloadStatus = "idle" | "generating" | "loading" | "success" | "error";
type SendStatus = "idle" | "loading" | "success" | "error";
type Panel = "menu" | "sms" | "email";

const BRAND = "#323c54";

export type PdfShareChannel = "sms" | "email";

export interface PdfActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string | number;
  questionUuid?: string;
  questionDate?: string;
  questionText?: string;
  /** True if the PDF is already generated — drives "Генерируем…" vs "Загружаем…" label. */
  hasPdf?: boolean;
  defaultPhone?: string;
  defaultEmail?: string;
  /** Public, non-expiring PDF link used for the "copy link" action. */
  shareLink: string;
  /**
   * Backend callbacks. When omitted the modal runs in demo mode and simulates
   * success via a short timeout — real handlers will be wired in once the
   * Quarkdown / SMS / email integrations are ready.
   */
  onDownload?: () => Promise<void>;
  onPreview?: () => Promise<void> | void;
  onSendSms?: (phoneE164: string) => Promise<void>;
  onSendEmail?: (email: string) => Promise<void>;
  /**
   * Called when the user clicks "copy link". When provided, this is the
   * authoritative source of the share URL — the modal will await it, copy
   * the returned string to the clipboard, and ignore `shareLink`. Use this
   * to guarantee a freshly-minted (or backend-warmed) token at click time
   * instead of relying on a value that may have been pre-fetched stale.
   */
  onCopyLink?: () => Promise<string>;
  /** Fired after a successful share so the parent can open the success modal. */
  onShareSuccess?: (channel: PdfShareChannel, target: string) => void;
}

export function PdfActionsModal({
  open,
  onOpenChange,
  questionId,
  questionDate,
  questionText,
  hasPdf = false,
  defaultPhone = "",
  defaultEmail = "",
  shareLink,
  onDownload,
  onPreview,
  onSendSms,
  onSendEmail,
  onCopyLink,
  onShareSuccess,
}: PdfActionsModalProps) {
  const [panel, setPanel] = useState<Panel>("menu");
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const [phoneInput, setPhoneInput] = useState(formatPhoneInput(defaultPhone));
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [smsStatus, setSmsStatus] = useState<SendStatus>("idle");

  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<SendStatus>("idle");

  const isDownloadBusy =
    downloadStatus === "loading" || downloadStatus === "generating";

  // Reset state after close. Timeout avoids text flicker while the dialog
  // plays its close animation.
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setPanel("menu");
      setDownloadStatus("idle");
      setPreviewLoading(false);
      setCopyStatus("idle");
      setSmsStatus("idle");
      setEmailStatus("idle");
      setPhoneError(null);
      setEmailError(null);
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  async function handleDownload() {
    if (isDownloadBusy) return;
    setDownloadStatus(hasPdf ? "loading" : "generating");
    try {
      if (onDownload) {
        await onDownload();
      } else {
        // Demo mode: simulate backend work until Quarkdown is wired up.
        await wait(hasPdf ? 600 : 1500);
      }
      setDownloadStatus("success");
      setTimeout(() => setDownloadStatus("idle"), 1500);
    } catch (err) {
      console.error("PdfActionsModal handleDownload", err);
      setDownloadStatus("error");
      setTimeout(() => setDownloadStatus("idle"), 2000);
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    try {
      if (onPreview) {
        await onPreview();
      } else {
        await wait(200);
        if (typeof window !== "undefined") {
          window.open(shareLink, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      console.error("PdfActionsModal handlePreview", err);
    } finally {
      setTimeout(() => setPreviewLoading(false), 400);
    }
  }

  async function handleCopyLink() {
    try {
      // Prefer the callback — it gives the parent a chance to mint/refresh
      // the secure token and warm the PDF cache server-side before the URL
      // hits the clipboard. Falls back to the `shareLink` prop only if no
      // callback was wired.
      const url = onCopyLink ? await onCopyLink() : shareLink;
      if (!url) throw new Error("No share URL available");
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("PdfActionsModal handleCopyLink", err);
    }
  }

  async function handleSendSms() {
    if (!isPhoneComplete(phoneInput)) {
      setPhoneError("Введите номер целиком");
      return;
    }
    setPhoneError(null);
    setSmsStatus("loading");
    const phoneE164 = "+" + phoneInput.replace(/\D/g, "");
    try {
      if (onSendSms) {
        await onSendSms(phoneE164);
      } else {
        await wait(800);
      }
      setSmsStatus("success");
      onShareSuccess?.("sms", phoneE164);
    } catch (err) {
      console.error("PdfActionsModal handleSendSms", err);
      setSmsStatus("error");
      setPhoneError("Не удалось отправить SMS. Попробуйте позже.");
    }
  }

  async function handleSendEmail() {
    if (!isValidEmail(email)) {
      setEmailError("Введите корректный email");
      return;
    }
    setEmailError(null);
    setEmailStatus("loading");
    try {
      if (onSendEmail) {
        await onSendEmail(email);
      } else {
        await wait(800);
      }
      setEmailStatus("success");
      onShareSuccess?.("email", email);
    } catch (err) {
      console.error("PdfActionsModal handleSendEmail", err);
      setEmailStatus("error");
      setEmailError("Не удалось отправить email. Попробуйте позже.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-sm p-0 gap-0 overflow-hidden border-0",
          // Default Dialog close button is dark text + opacity-70 — invisible
          // against our dark header. Override: white icon, rounded hover pill
          // with subtle white tint, full-white text on hover, larger hit area.
          "[&>button]:top-4 [&>button]:right-4 [&>button]:p-1.5 [&>button]:rounded-md",
          "[&>button]:opacity-100 [&>button]:text-white/70",
          "[&>button]:transition-colors",
          "[&>button:hover]:bg-white/15 [&>button:hover]:text-white",
          "[&>button>svg]:size-4",
        )}
      >
        <div
          className="px-5 pt-5 pb-4 text-white"
          style={{ backgroundColor: BRAND }}
        >
          <DialogTitle className="text-base font-semibold leading-tight pr-8">
            Вопрос и ответ #{questionId}
          </DialogTitle>
          {questionDate && (
            <p className="mt-1.5 text-[12px] text-white/70">
              Дата обращения: {questionDate}
            </p>
          )}
          {questionText && (
            <p className="mt-3 text-sm text-white/90 leading-snug pr-8 line-clamp-3">
              {questionText}
            </p>
          )}
        </div>

        <div className="p-4 space-y-3 bg-white">
          {panel === "menu" && (
            <MenuPanel
              isDownloadBusy={isDownloadBusy}
              downloadStatus={downloadStatus}
              previewLoading={previewLoading}
              copyStatus={copyStatus}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onCopyLink={handleCopyLink}
              onOpenSms={() => setPanel("sms")}
              onOpenEmail={() => setPanel("email")}
            />
          )}

          {panel === "sms" && (
            <SubPanel
              title="Отправить по SMS"
              onBack={() => {
                setPanel("menu");
                setSmsStatus("idle");
              }}
            >
              <div className="space-y-3">
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="+7 (___) ___-__-__"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(formatPhoneInput(e.target.value));
                    setPhoneError(null);
                  }}
                  disabled={smsStatus === "loading"}
                  aria-invalid={!!phoneError}
                  className={cn(
                    "tabular-nums",
                    phoneError &&
                      "border-red-500! text-red-600! placeholder:text-red-400! focus-visible:ring-red-500/30!",
                  )}
                />
                {phoneError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {phoneError}
                  </p>
                )}
                <Button
                  onClick={handleSendSms}
                  disabled={smsStatus === "loading"}
                  className="w-full text-white hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  {smsStatus === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Отправляем…
                    </>
                  ) : (
                    "Отправить"
                  )}
                </Button>
              </div>
            </SubPanel>
          )}

          {panel === "email" && (
            <SubPanel
              title="Отправить на email"
              onBack={() => {
                setPanel("menu");
                setEmailStatus("idle");
              }}
            >
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  disabled={emailStatus === "loading"}
                  aria-invalid={!!emailError}
                  className={cn(
                    emailError &&
                      "border-red-500! text-red-600! placeholder:text-red-400! focus-visible:ring-red-500/30!",
                  )}
                />
                {emailError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {emailError}
                  </p>
                )}
                <Button
                  onClick={handleSendEmail}
                  disabled={emailStatus === "loading"}
                  className="w-full text-white hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  {emailStatus === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Отправляем…
                    </>
                  ) : (
                    "Отправить"
                  )}
                </Button>
              </div>
            </SubPanel>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MenuPanelProps {
  isDownloadBusy: boolean;
  downloadStatus: DownloadStatus;
  previewLoading: boolean;
  copyStatus: "idle" | "copied";
  onDownload: () => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onOpenSms: () => void;
  onOpenEmail: () => void;
}

function MenuPanel({
  isDownloadBusy,
  downloadStatus,
  previewLoading,
  copyStatus,
  onDownload,
  onPreview,
  onCopyLink,
  onOpenSms,
  onOpenEmail,
}: MenuPanelProps) {
  return (
    <>
      <Button
        onClick={onDownload}
        disabled={isDownloadBusy}
        className="w-full h-11 text-sm text-white hover:opacity-90"
        style={{ backgroundColor: BRAND }}
      >
        {isDownloadBusy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {downloadStatus === "generating" ? "Генерируем…" : "Загружаем…"}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" /> Скачать PDF
          </>
        )}
      </Button>

      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-4 gap-2">
          <IconAction
            tooltip="Открыть предпросмотр в новой вкладке"
            icon={<Eye className="h-4 w-4" />}
            label="Просмотр"
            onClick={onPreview}
            loading={previewLoading}
            disabled={isDownloadBusy}
          />
          <IconAction
            tooltip="Отправить SMS со ссылкой"
            icon={<MessageSquare className="h-4 w-4" />}
            label="SMS"
            onClick={onOpenSms}
            disabled={isDownloadBusy}
          />
          <IconAction
            tooltip="Отправить на email"
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            onClick={onOpenEmail}
            disabled={isDownloadBusy}
          />
          <IconAction
            tooltip="Скопировать защищённую ссылку"
            icon={
              copyStatus === "copied" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Link2 className="h-4 w-4" />
              )
            }
            label={copyStatus === "copied" ? "Готово" : "Ссылка"}
            onClick={onCopyLink}
            disabled={isDownloadBusy}
          />
        </div>
      </TooltipProvider>
    </>
  );
}

interface IconActionProps {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function IconAction({
  icon,
  label,
  tooltip,
  onClick,
  disabled,
  loading,
}: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || loading}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2.5 px-1 transition-colors",
            "hover:border-slate-300 hover:bg-slate-50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <span className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
          </span>
          <span className="text-[11px] font-medium text-slate-700 leading-none">
            {label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

interface SubPanelProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

function SubPanel({ title, onBack, children }: SubPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          ← Назад
        </button>
        <span className="text-xs font-semibold text-slate-900">{title}</span>
      </div>
      {children}
    </div>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
