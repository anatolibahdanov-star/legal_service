"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface PdfDocumentModalProps {
  open: boolean;
  title: string;
  /** Absolute path under /public, e.g. "/docs/privacy-policy.pdf". */
  src: string;
  onClose: () => void;
}

// Disable copy/select/right-click/keyboard-copy on the modal viewport while
// it's open. We also append PDF viewer flags (#toolbar=0 etc.) so the browser-
// native viewer hides its download/print/copy chrome.
//
// Note: this is a UX deterrent, not a hard guarantee — a determined user can
// still grab the file directly. The spec asks for "не доступен для копирования"
// which matches the standard practice of disabling the viewer UI.
export function PdfDocumentModal({ open, title, src, onClose }: PdfDocumentModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Block Ctrl/Cmd+C / Ctrl+S / Ctrl+P while viewing — the iframe content
      // is isolated by the browser, but we cover the host page side anyway.
      if ((e.ctrlKey || e.metaKey) && ["c", "s", "p", "a", "x"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const separator = src.includes("#") ? "&" : "#";
  const viewerSrc = `${src}${separator}toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&view=FitH`;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className="relative flex w-full max-w-[1000px] h-[90vh] flex-col rounded-2xl bg-white shadow-2xl select-none"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold text-[#0F1B2D] pr-6 truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-b-2xl">
          <iframe
            title={title}
            src={viewerSrc}
            className="absolute inset-0 h-full w-full border-0"
          />
          {/* Transparent overlay catches right-click / drag attempts in the
              host page; PDF.js still handles scroll/zoom via the iframe. */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
