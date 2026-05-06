import Link from 'next/link';

interface PaymentAlfaBankPropsI {
    redirectToAlfa: () => void;
}

const PaymentAlfaBank = ({redirectToAlfa}: PaymentAlfaBankPropsI) => {
  return (
    <div className="flex h-full flex-col bg-white rounded shadow-sm border border-[#e0e0e0] bg-card p-6">
      <div className="min-h-[220px]">
        <h3 className="text-lg font-semibold text-foreground">Оплатить через Альфа-Банк</h3>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Перейдите на страницу оплаты и<br />подтвердите платёж</p>
          <svg width="140" height="40" viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect x="4" y="4" width="72" height="72" rx="14" stroke="#EE2A23" strokeWidth="6" fill="none"/>
            <text x="40" y="58" textAnchor="middle" fill="#EE2A23" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="48">A</text>
            <text x="96" y="38" fill="#333" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="24">Alfa</text>
            <circle cx="133" cy="32" r="2.5" fill="#333"/>
            <text x="142" y="38" fill="#333" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="24">Bank</text>
          </svg>
        </div>
        <Link href="#" onClick={redirectToAlfa} 
          className="mt-5 inline-block rounded-lg bg-[#EE2A23] px-6 py-2.5 text-sm font-medium text-alfa-red-foreground transition-opacity hover:opacity-90"
        >Перейти к оплате</Link>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Безопасная оплата через банк</p>
        <p className="text-xs text-muted-foreground">Зачисление — мгновенно</p>
        <p className="mt-3 text-xs text-muted-foreground">Оплата выполняется на стороне банка</p>
      </div>
    </div>
  );
};

export default PaymentAlfaBank;