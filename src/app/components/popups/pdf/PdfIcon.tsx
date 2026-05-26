"use client";

import { FileText } from "lucide-react";
import { cn } from "@/src/app/components/ui/utils";

export function PdfIcon({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <FileText className="size-5" />
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-bold leading-none px-0.5 rounded-sm bg-red-500 text-white">
        PDF
      </span>
    </span>
  );
}
