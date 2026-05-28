"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

export interface PdfDocumentModalProps {
  open: boolean;
  title: string;
  /** Absolute path under /public, e.g. "/docs/privacy-policy.pdf". */
  src: string;
  onClose: () => void;
}

// PDF.js needs a worker script. Bundling via `new URL(..., import.meta.url)`
// lets Turbopack/Webpack emit it as a static asset with a hashed filename,
// so it stays version-locked to pdfjs-dist and doesn't depend on a CDN.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// We render pages to canvas with `renderTextLayer={false}` so PDF.js doesn't
// emit a selectable text overlay — there is literally no text in the DOM the
// user could copy. The host-page handlers below (oncopy/contextmenu/keyboard)
// are kept as extra deterrents for the modal chrome and for the few pixels
// outside the canvas area.
export function PdfDocumentModal({ open, title, src, onClose }: PdfDocumentModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [numPages, setNumPages] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
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

  useEffect(() => {
    if (!open) return;
    const el = contentRef.current;
    if (!el) return;
    const update = () => setPageWidth(Math.max(320, el.clientWidth - 32));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  if (!open) return null;

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

        <div
          ref={contentRef}
          className="relative flex-1 overflow-y-auto overflow-x-hidden rounded-b-2xl bg-gray-100 px-4 py-4"
        >
          {loadError ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-600">
              Не удалось загрузить документ.
            </div>
          ) : (
            <Document
              key={src}
              file={src}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={(err) => setLoadError(err.message)}
              loading={
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Загрузка…
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, i) => (
                <div key={i} className="mb-4 flex justify-center last:mb-0">
                  <Page
                    pageNumber={i + 1}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-md"
                  />
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
