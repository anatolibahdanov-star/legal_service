import { DBUser } from '@/src/interfaces/db';
import Link from 'next/link';

interface BalanceCardPropsI {
    handleCreateOrder: () => void;
    data: DBUser|null;
}

const BalanceCard = ({handleCreateOrder, data}: BalanceCardPropsI) => {
    const rubFormatter = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB', // Use "RUB" as the ISO code for Russian Ruble
    });
    const balance = data?.balance ?? 0
    const balanceFormated = rubFormatter.format(balance)
  return (
    <div className="rounded-lg bg-white rounded shadow-sm border border-[#e0e0e0] bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">Текущий баланс</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{balanceFormated}</p>
      <p className="mt-2 text-sm text-muted-foreground">Доступно для оплаты услуг платформы</p>
      {/* <p className="mt-4 text-xs text-muted-foreground">Updated: 2026-04-12</p> */}
      <Link href="#" 
        className="mt-5 inline-block rounded-lg bg-[#EE2A23] px-6 py-2.5 text-sm font-medium text-alfa-red-foreground transition-opacity hover:opacity-90"
        onClick={handleCreateOrder}>Пополнить баланс на 100 рублей</Link>
    </div>
  );
};

export default BalanceCard;
