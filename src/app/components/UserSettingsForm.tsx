import { useState } from "react";

interface Request {
  id: number;
  question: string;
  questionLink?: string;
  date: string;
  answer: string;
  answerLink?: string;
  status: "answered" | "pending";
  lastActivity: string;
}

interface UserSettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentEmail?: string;
}

// Моковые данные для демонстрации
const mockRequests: Request[] = [
  {
    id: 1,
    question: "Какие документы нужны для оформления наследства?",
    questionLink: "/question/1",
    date: "15.02.2026",
    answer: "Для оформления наследства вам понадобятся следующие документы...",
    answerLink: "/answer/1",
    status: "answered",
    lastActivity: "16.02.2026"
  },
  {
    id: 2,
    question: "Как правильно составить договор аренды квартиры?",
    questionLink: "/question/2",
    date: "10.02.2026",
    answer: "Договор аренды квартиры должен содержать: данные сторон...",
    answerLink: "/answer/2",
    status: "answered",
    lastActivity: "11.02.2026"
  },
  {
    id: 3,
    question: "Могу ли я вернуть товар ненадлежащего качества?",
    questionLink: "/question/3",
    date: "05.02.2026",
    answer: "Да, согласно Закону «О защите прав потребителей»...",
    answerLink: "/answer/3",
    status: "answered",
    lastActivity: "06.02.2026"
  },
  {
    id: 4,
    question: "Какова процедура развода через ЗАГС?",
    questionLink: "/question/4",
    date: "01.02.2026",
    answer: "",
    answerLink: "",
    status: "pending",
    lastActivity: "01.02.2026"
  }
];

export function UserSettingsForm({ 
  isOpen, 
  onClose, 
  currentName = "Иван Петров",
  currentEmail = "user@example.com" 
}: UserSettingsFormProps) {
  const [name, setName] = useState(currentName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ name: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requests] = useState<Request[]>(mockRequests);

  const validateForm = () => {
    const newErrors = { name: "", currentPassword: "", newPassword: "", confirmPassword: "" };
    let isValid = true;

    // Валидация имени
    if (!name.trim()) {
      newErrors.name = "Пожалуйста, введите ваше имя";
      isValid = false;
    }

    // Валидация пароля (только если пользователь хочет его изменить)
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = "Введите текущий пароль";
        isValid = false;
      }

      if (!newPassword) {
        newErrors.newPassword = "Пожалуйста, введите новый пароль";
        isValid = false;
      } else if (newPassword.length < 6) {
        newErrors.newPassword = "Пароль должен содержать минимум 6 символов";
        isValid = false;
      }

      // Валидация подтверждения пароля
      if (!confirmPassword) {
        newErrors.confirmPassword = "Пожалуйста, подтвердите новый пароль";
        isValid = false;
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Пароли не совпадают";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log("Обновление настроек:", { 
        name, 
        passwordChanged: !!newPassword 
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
      }, 2000);
      // Здесь будет логика обновления данных пользователя
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2d3b4e] overflow-auto z-50">
      <div className="min-h-full p-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Шапка */}
          <div className="flex items-center justify-between mb-[40px]">
            <h1 className="font-['Inter:Bold',sans-serif] font-bold leading-[48px] text-[36px] text-white">
              Личный кабинет пользователя
            </h1>
            <button
              onClick={onClose}
              className="flex items-center gap-[12px] bg-[#3d4b5e] h-[50px] px-[24px] rounded-[12px] font-['Inter:Medium',sans-serif] font-medium text-[16px] text-white hover:bg-[#4d5b6e] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Вернуться на главную
            </button>
          </div>

          {/* Блок 1: Учетная запись */}
          <div className="bg-[#3d4b5e] rounded-[24px] p-[40px] mb-[32px]">
            <h2 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white mb-[24px]">
              Учетная запись
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-[32px]" noValidate>
              {/* Левая колонка - персональные данные */}
              <div className="flex flex-col gap-[16px]">
                <h3 className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[18px] text-[rgba(255,255,255,0.9)] mb-[8px]">
                  Персональные данные
                </h3>

                {/* Имя поле */}
                <div className="flex flex-col gap-[8px]">
                  <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                    Ваше имя: *
                  </label>
                  <div className="relative h-[60px] rounded-[16px]">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) {
                          setErrors({ ...errors, name: "" });
                        }
                      }}
                      placeholder="Имя"
                      className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                        errors.name 
                          ? "border-red-400 focus:border-red-500" 
                          : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                      } focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.name && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email поле (только для отображения) */}
                <div className="flex flex-col gap-[8px]">
                  <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                    Электронная почта:
                  </label>
                  <div className="relative h-[60px] rounded-[16px]">
                    <input
                      type="text"
                      value={currentEmail}
                      disabled
                      className="w-full h-full px-[20px] py-[16px] bg-[rgba(255,255,255,0.05)] font-['Inter:Regular',sans-serif] font-normal text-[16px] text-[rgba(255,255,255,0.5)] cursor-not-allowed rounded-[16px] border-2 border-[rgba(255,255,255,0.1)]"
                    />
                  </div>
                  <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.5)] ml-[4px]">
                    Email нельзя изменить
                  </p>
                </div>
              </div>

              {/* Правая колонка - изменение пароля */}
              <div className="flex flex-col gap-[16px]">
                <h3 className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[18px] text-[rgba(255,255,255,0.9)] mb-[8px]">
                  Изменение пароля
                </h3>

                {/* Текущий пароль */}
                <div className="flex flex-col gap-[8px]">
                  <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                    Текущий пароль:
                  </label>
                  <div className="relative h-[60px] rounded-[16px]">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (errors.currentPassword) {
                          setErrors({ ...errors, currentPassword: "" });
                        }
                      }}
                      placeholder="Введите текущий пароль"
                      className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                        errors.currentPassword 
                          ? "border-red-400 focus:border-red-500" 
                          : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                      } focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.currentPassword && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {/* Новый пароль поле */}
                <div className="flex flex-col gap-[8px]">
                  <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                    Новый пароль:
                  </label>
                  <div className="relative h-[60px] rounded-[16px]">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) {
                          setErrors({ ...errors, newPassword: "" });
                        }
                      }}
                      placeholder="Минимум 6 символов"
                      className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                        errors.newPassword 
                          ? "border-red-400 focus:border-red-500" 
                          : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                      } focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                {/* Подтверждение нового пароля поле */}
                <div className="flex flex-col gap-[8px]">
                  <label className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(255,255,255,0.9)]">
                    Подтверждение пароля:
                  </label>
                  <div className="relative h-[60px] rounded-[16px]">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors({ ...errors, confirmPassword: "" });
                        }
                      }}
                      placeholder="Повторите новый пароль"
                      className={`w-full h-full px-[20px] py-[16px] bg-transparent font-['Inter:Regular',sans-serif] font-normal text-[16px] text-white placeholder:text-[rgba(255,255,255,0.4)] rounded-[16px] border-2 ${
                        errors.confirmPassword 
                          ? "border-red-400 focus:border-red-500" 
                          : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                      } focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Кнопки */}
              <div className="col-span-2 flex gap-[16px] justify-end mt-[8px]">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-[rgba(255,255,255,0.7)] border-2 border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitted}
                  className={`h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white transition-colors ${
                    isSubmitted 
                      ? "bg-[#4ade80] cursor-not-allowed" 
                      : "bg-[#87b7ce] hover:bg-[#6fa2b8]"
                  }`}
                >
                  {isSubmitted ? "Сохранено ✓" : "Сохранить изменения"}
                </button>
              </div>
            </form>
          </div>

          {/* Блок 2: Мои вопросы */}
          <div className="bg-[#3d4b5e] rounded-[24px] p-[40px]">
            <div className="flex items-center justify-between mb-[24px]">
              <h2 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white">
                Мои вопросы
              </h2>
              <button
                className="bg-[#87b7ce] h-[50px] px-[32px] rounded-[12px] font-['Inter:Medium',sans-serif] font-medium text-[16px] text-white hover:bg-[#6fa2b8] transition-colors"
              >
                Задать новый вопрос юристу
              </button>
            </div>

            {/* Таблица */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[rgba(255,255,255,0.1)]">
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      ID
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Вопрос
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Дата
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Ответ
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Статус
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Последняя активность
                    </th>
                    <th className="text-center py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Открыть
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr 
                      key={request.id} 
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                    >
                      <td className="py-[16px] px-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-white">
                        #{request.id}
                      </td>
                      <td className="py-[16px] px-[12px]">
                        <a 
                          href={request.questionLink}
                          onClick={(e) => e.preventDefault()}
                          className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors line-clamp-2"
                        >
                          {request.question}
                        </a>
                      </td>
                      <td className="py-[16px] px-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.8)]">
                        {request.date}
                      </td>
                      <td className="py-[16px] px-[12px]">
                        {request.answer ? (
                          <a 
                            href={request.answerLink}
                            onClick={(e) => e.preventDefault()}
                            className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors line-clamp-2"
                          >
                            {request.answer.substring(0, 50)}...
                          </a>
                        ) : (
                          <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-[16px] px-[12px]">
                        <span className={`px-[12px] py-[6px] rounded-[8px] font-['Inter:Medium',sans-serif] font-medium text-[12px] inline-block ${
                          request.status === "answered" 
                            ? "bg-[#4ade80]/20 text-[#4ade80]" 
                            : "bg-[#fbbf24]/20 text-[#fbbf24]"
                        }`}>
                          {request.status === "answered" ? "Отвечено" : "В обработке"}
                        </span>
                      </td>
                      <td className="py-[16px] px-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.8)]">
                        {request.lastActivity}
                      </td>
                      <td className="py-[16px] px-[12px] text-center">
                        <button
                          onClick={() => console.log("Открыть вопрос", request.id)}
                          className="bg-[#87b7ce] px-[20px] py-[8px] rounded-[8px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-white hover:bg-[#6fa2b8] transition-colors"
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {requests.length === 0 && (
              <div className="text-center py-[60px]">
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[16px] text-[rgba(255,255,255,0.6)]">
                  У вас пока нет вопросов
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}