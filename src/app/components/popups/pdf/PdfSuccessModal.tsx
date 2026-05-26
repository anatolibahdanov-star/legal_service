"use client";

import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/src/app/components/ui/dialog";
import { Button } from "@/src/app/components/ui/button";

interface PdfSuccessModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  questionId: string | number;
  questionDate?: string;
  message?: string;
}

export function PdfSuccessModal({
  open,
  onOpenChange,
  questionId,
  questionDate,
  message = "PDF успешно отправлен",
}: PdfSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden border-0">
        <div className="bg-[#323c54] px-6 pt-6 pb-5 text-white">
          <DialogTitle className="text-lg font-semibold leading-tight pr-8">
            Вопрос и ответ #{questionId}
          </DialogTitle>
          {questionDate && (
            <p className="mt-2 text-xs text-white/70">Дата обращения: {questionDate}</p>
          )}
        </div>

        <div className="px-6 py-8 bg-white flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-emerald-100">
            <Check className="size-12 text-emerald-600 stroke-[2.5]" />
          </div>
          <p className="text-base font-medium text-[#29282b]">{message}</p>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: "#323c54" }}
          >
            Готово
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
