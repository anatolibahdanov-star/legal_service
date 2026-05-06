'use client'; 
// import { Link } from "@tanstack/react-router";
import { Button } from "@/src/app/components/ui/button";
import Image from 'next/image'
import { useParams, useRouter } from "next/navigation";

interface PaymentAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

interface PaymentStatusLayoutProps {
  image: string;
  imageAlt: string;
  title: string;
  subtitle: string;
  description?: string;
  badge?: {
    text: string;
    type: "success" | "error" | "warning";
  };
  details?: { label: string; value: string }[];
  actions: PaymentAction[];
  footnote?: string;
}

const badgeStyles = {
  success: "bg-[#2196f3] text-[#2196f3]",
  error: "bg-[#2196f3] text-[#2196f3]",
  warning: "bg-warning-muted text-warning-foreground",
};

export default function BalancePage() {
  const params = useParams()
  const router = useRouter()
  const is_good = params.slug === "success"
  const image = is_good ? "/assets/payment-success.png" : "/assets/payment-failed.png"
  const imageAlt = is_good ? "Успешная оплата" : "Ошибка при оплате"
  const badge = is_good ? {text: "✔ Баланс пополнен", type: "success"} : {text: "✘ Платёж не выполнен", type: "error"}
  const title = is_good ? "Баланс успешно пополнен" : "Не удалось выполнить платёж"
  const subtitle = is_good ? 
    "Деньги будут зачислены на ваш счёт в течении нескольких минут. После этого вы сможете оплатить консультацию юриста или задать вопрос." : 
    "Что-то пошло не так. Деньги не списаны или платёж не завершён. Попробуйте ещё раз или выберите другой способ оплаты."
  const description = null
  const footnote = is_good ? "Если платёж отображается с задержкой — обновите страницу или проверьте баланс позже." : ""

  const handleReturnBalance = () => {
    router.push('/profile?tab=balance')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[890px]">
        <div className="rounded-3xl bg-surface-elevated p-8 shadow-[0_4px_40px_-12px_oklch(0.5_0.02_260/0.12)] sm:p-12">
          {/* Image */}
          <div className="mx-auto mb-8 flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96">
            <Image src={image} alt={imageAlt} width={384} height={384} className="h-80 w-80 object-contain sm:h-96 sm:w-96" />
          </div>

          {/* Badge */}
          {badge && (
            <div className="mb-4 flex justify-center">
              <span
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ${
                  badge.type === "success" ? "bg-[#C9F1E2] text-[#6ED2A2]" : "bg-[#EF44441A] text-[#EF4444]"
                }`}
              >
                {badge.text}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>

          {/* Subtitle */}
          <p className="mt-2 text-center text-base text-muted-foreground">{subtitle}</p>

          {/* Description */}
          {description && (
            <p className="mt-1 text-center text-sm text-muted-foreground/70">{description}</p>
          )}

          {/* Details */}
          {/* {details && details.length > 0 && (
            <div className="mt-8 space-y-3 rounded-2xl bg-surface p-5">
              {details.map((detail, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="font-semibold text-foreground">{detail.value}</span>
                </div>
              ))}
            </div>
          )} */}

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button key="back_to_balance_btn" variant="outline" size="lg" 
              className="w-full rounded-xl border border-[#e0e0e0] text-[#f44336] rounded hover:bg-[#f5f5f5] transition-colors sm:w-auto" onClick={handleReturnBalance}>
              Вернуться к странице Баланса
            </Button>
          </div>
          

          {/* Footnote */}
          {footnote && (
            <p className="mt-6 text-center text-xs text-muted-foreground/60">{footnote}</p>
          )}
        </div>
      </div>
    </div>
  );
}