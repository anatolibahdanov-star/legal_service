import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

import { CustomGetRequest } from "@/src/libs/request";
import { PaginationApp } from "@/src/app/components/data/pagination";
import {
  PaymentDisplayStatusE,
  PaymentHistoryItemI,
  PaymentMethodE,
  PaymentOperationE,
} from "@/src/interfaces/payment";

const operationLabels: Record<PaymentOperationE, string> = {
  [PaymentOperationE.Payment]: "Оплата",
  [PaymentOperationE.Topup]: "Пополнение баланса",
  [PaymentOperationE.Charge]: "Списание с баланса",
};

const methodLabels: Record<PaymentMethodE, string> = {
  [PaymentMethodE.Card]: "Карта",
  [PaymentMethodE.Sbp]: "СБП",
  [PaymentMethodE.AlfaPay]: "Альфа Pay",
  [PaymentMethodE.YandexPay]: "Yandex Pay",
  [PaymentMethodE.Balance]: "Баланс",
};

const statusLabels: Record<PaymentDisplayStatusE, string> = {
  [PaymentDisplayStatusE.Success]: "Успешно",
  [PaymentDisplayStatusE.Processing]: "В обработке",
  [PaymentDisplayStatusE.Error]: "Ошибка",
  [PaymentDisplayStatusE.Cancelled]: "Не оплачен",
};

const statusColors: Record<PaymentDisplayStatusE, string> = {
  [PaymentDisplayStatusE.Success]: "bg-[#10b981] text-white",
  [PaymentDisplayStatusE.Processing]: "bg-[#f59e0b] text-white",
  [PaymentDisplayStatusE.Error]: "bg-[#ef4444] text-white",
  [PaymentDisplayStatusE.Cancelled]: "bg-[#94a3b8] text-white",
};

const rubFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const formatAmount = (amount: number): string => `${rubFormatter.format(amount)} ₽`;

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd.MM.yyyy в HH:mm");
};

const itemsPerPage = 10;

export const ProfilePaymentHistory = () => {
  const [items, setItems] = useState<PaymentHistoryItemI[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalTopups, setTotalTopups] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const domainUrl = process.env.NEXT_PUBLIC_URL;

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const res = await CustomGetRequest("/payments", {
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (active && res.status && res.data) {
        setItems(res.data.items ?? []);
        setTotalItems(res.data.count ?? 0);
        setTotalExpenses(res.data.totalExpenses ?? 0);
        setTotalTopups(res.data.totalTopups ?? 0);
      }
      if (active) setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [currentPage]);

  const renderDescription = (item: PaymentHistoryItemI) => {
    if (item.operation === PaymentOperationE.Topup) {
      return <span className="text-[#87b7ce]">Пополнение баланса</span>;
    }
    if (item.questionId) {
      const label = `Вопрос №${item.questionId}`;
      if (item.questionUuid) {
        return (
          <Link
            href={`${domainUrl}/consultation/${item.questionUuid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#87b7ce] hover:text-[#6fa2b8] transition-colors"
          >
            {label}
          </Link>
        );
      }
      return <span className="text-[#87b7ce]">{label}</span>;
    }
    return <span className="text-[#757575]">—</span>;
  };

  return (
    <div>
      <div className="mt-2 mb-8 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[240px] rounded-2xl border border-[#e0e0e0] bg-white px-8 py-6">
          <p className="text-sm text-[#6b7280] mb-3">Общая сумма расходов</p>
          <p className="text-[40px] leading-none font-bold text-[#ef4444]">
            {formatAmount(totalExpenses)}
          </p>
        </div>
        <div className="flex-1 min-w-[240px] rounded-2xl border border-[#e0e0e0] bg-white px-8 py-6">
          <p className="text-sm text-[#6b7280] mb-3">Общая сумма пополнений</p>
          <p className="text-[40px] leading-none font-bold text-[#10b981]">
            {formatAmount(totalTopups)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0e0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                <th className="text-left p-4 text-xs text-[#757575] font-normal">ID платежа</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Дата и время</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Сумма</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Тип операции</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Статус</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Способ оплаты</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Услуга / Основание</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[#e0e0e0] hover:bg-[#f5f5f5]">
                  <td className="p-4 text-sm font-medium text-[#29282b] whitespace-nowrap">{item.displayId}</td>
                  <td className="p-4 text-sm text-[#333] whitespace-nowrap">{formatDate(item.createdAt)}</td>
                  <td className="p-4 text-sm text-[#333] whitespace-nowrap">{formatAmount(item.amount)}</td>
                  <td className="p-4 text-sm text-[#333] whitespace-nowrap">{operationLabels[item.operation]}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[#333] whitespace-nowrap">{methodLabels[item.method]}</td>
                  <td className="p-4 text-sm whitespace-nowrap">{renderDescription(item)}</td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-sm text-[#757575]" colSpan={7}>
                    Платежей пока нет
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td className="p-8 text-center text-sm text-[#757575]" colSpan={7}>
                    Загружается...
                  </td>
                </tr>
              )}

              {totalItems > itemsPerPage && (
                <tr className="border-t border-[#e0e0e0]">
                  <td className="p-4" colSpan={7}>
                    <PaginationApp
                      activePage={currentPage}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      totalItems={totalItems}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
