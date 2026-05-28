"use client";

import dynamic from "next/dynamic";
import type { PdfDocumentModalProps } from "./PdfDocumentModalClient";

// PDF.js touches browser-only globals (DOMMatrix, etc.) at module load, so
// we defer the entire modal to client-side with `ssr: false`. The wrapper
// stays cheap during SSR.
const PdfDocumentModalImpl = dynamic(
  () => import("./PdfDocumentModalClient").then((m) => m.PdfDocumentModal),
  { ssr: false },
);

export type { PdfDocumentModalProps };

export function PdfDocumentModal(props: PdfDocumentModalProps) {
  return <PdfDocumentModalImpl {...props} />;
}
