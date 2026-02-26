import { useState } from "react";

interface Request {
  id: number;
  date: string;
  question: string;
  answer: string;
  status: "answered" | "pending";
  link?: string;
}

interface RequestHistoryFormProps {
  isOpen: boolean;
  onClose: () => void;
}

// Моковые данные для демонстрации
const mockRequests: Request[] = [
  {
    id: 1,
    date: "15 февраля 2026",
    question: "Какие документы нужны для оформления наследства?",
    answer: "Для оформления наследства вам понадобятся следующие документы: свидетельство о смерти наследодателя, документы, подтверждающие родство с умершим, паспорт наследника, документы на имущество (свидетельство о праве собственности, технический паспорт и т.д.), завещание (если имеется). Рекомендую обратиться к нотариусу для получения свидетельства о праве на наследство.",
    status: "answered",
    link: "/consultation/1"
  },
  {
    id: 2,
    date: "10 февраля 2026",
    question: "Как правильно составить договор аренды квартиры?",
    answer: "Договор аренды квартиры должен содержать: данные сторон (арендодателя и арендатора), описание объекта аренды с указанием адреса, срок аренды, размер арендной платы и порядок её внесения, права и обязанности сторон, порядок расторжения договора. Договор составляется в письменной форме и подписывается обеими сторонами. Если срок аренды превышает 11 месяцев, договор подлежит государственной регистрации.",
    status: "answered",
    link: "/consultation/2"
  },
  {
    id: 3,
    date: "5 февраля 2026",
    question: "Могу ли я вернуть товар ненадлежащего качества через 2 недели после покупки?",
    answer: "Да, согласно Закону «О защите прав потребителей», вы имеете право на возврат товара ненадлежащего качества в течение гарантийного срока или срока годности. Если эти сроки не установлены, вы можете предъявить претензии в разумный срок, но не более двух лет со дня покупки. При обнаружении недостатков вы вправе потребовать замены, ремонта, снижения цены или возврата денег.",
    status: "answered",
    link: "/consultation/3"
  },
  {
    id: 4,
    date: "1 февраля 2026",
    question: "Какова процедура развода через ЗАГС?",
    answer: "",
    status: "pending"
  }
];

export function RequestHistoryForm({ isOpen, onClose }: RequestHistoryFormProps) {
  const [requests] = useState<Request[]>(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#3d4b5e] rounded-[24px] p-[40px] w-full max-w-[900px] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-[20px] right-[20px] text-white/60 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Заголовок */}
        <div className="mb-[32px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[12px]">
            История запросов
          </h1>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[22.75px] text-[14px] text-[rgba(255,255,255,0.8)]">
            Все ваши обращения к юристам и полученные консультации
          </p>
        </div>

        {/* Список запросов */}
        <div className="flex flex-col gap-[16px]">
          {requests.length === 0 ? (
            <div className="text-center py-[40px]">
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[16px] text-[rgba(255,255,255,0.6)]">
                У вас пока нет запросов
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[24px] border-2 border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-colors"
              >
                {/* Заголовок карточки */}
                <div className="flex items-start justify-between mb-[16px]">
                  <div className="flex-1">
                    <div className="flex items-center gap-[12px] mb-[8px]">
                      <span className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.6)]">
                        {request.date}
                      </span>
                      <span className={`px-[12px] py-[4px] rounded-[8px] font-['Inter:Medium',sans-serif] font-medium text-[12px] ${
                        request.status === "answered" 
                          ? "bg-[#4ade80]/20 text-[#4ade80]" 
                          : "bg-[#fbbf24]/20 text-[#fbbf24]"
                      }`}>
                        {request.status === "answered" ? "Отвечено" : "Ожидает ответа"}
                      </span>
                    </div>
                    <h3 className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[16px] text-white">
                      {request.question}
                    </h3>
                  </div>
                </div>

                {/* Ответ */}
                {request.answer && (
                  <div className="mb-[16px]">
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[22px] text-[14px] text-[rgba(255,255,255,0.8)]">
                      {selectedRequest?.id === request.id || request.answer.length < 200
                        ? request.answer
                        : `${request.answer.substring(0, 200)}...`}
                    </p>
                    {request.answer.length > 200 && (
                      <button
                        onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                        className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] mt-[8px] transition-colors"
                      >
                        {selectedRequest?.id === request.id ? "Свернуть" : "Читать полностью"}
                      </button>
                    )}
                  </div>
                )}

                {/* Ссылка на полную консультацию */}
                {request.link && (
                  <div className="flex items-center gap-[8px]">
                    <a
                      href={request.link}
                      className="inline-flex items-center gap-[8px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Открыть полную консультацию
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Кнопка новый запрос */}
        <div className="mt-[24px] pt-[24px] border-t border-[rgba(255,255,255,0.1)]">
          <button
            onClick={onClose}
            className="w-full bg-[#87b7ce] h-[60px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#6fa2b8] transition-colors"
          >
            Создать новый запрос
          </button>
        </div>
      </div>
    </div>
  );
}
