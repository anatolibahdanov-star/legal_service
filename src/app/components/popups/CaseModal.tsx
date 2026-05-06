import { X, Star, MessageSquare, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DBQuestion } from "@/src/interfaces/db";
import { QuestionStatusesE, dFormat } from "@/src/interfaces/data";
import {CaseModalProps} from "@/src/interfaces/component";
import Link from 'next/link';
import { JobDataI, JobIdI, RatingFormI, RequestFormI } from '@/src/interfaces/form';
import { CustomGetRequest } from "@/src/libs/request"
import { submitRequestFormAction } from "@/src/app/components/forms/action/request";
import { submitRatingFormAction } from "../forms/action/rating";
import { format } from 'date-fns';
import { ChatMessage } from "@/src/app/components/data/ChatMessage";

export function CaseModal({ caseItem, isOpen, onClose, openRatingSection, user, openNewQuestionWindow }: CaseModalProps) {
  const [isRatingExpanded, setIsRatingExpanded] = useState(false);
  const [rating, setRating] = useState(caseItem.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(caseItem.rating ? true : false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [ratingDate, setRatingDate] = useState(caseItem.rating_date);
  const [savedComment, setSavedComment] = useState(caseItem.comment ?? "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [askClarificationMessageId, setAskClarificationMessageId] = useState("");
  const [showQuestionSaved, setShowQuestionSaved] = useState(false);
  const [data, setData] = useState<JobDataI | null>(null);

  useEffect(() => {
      const path = "/requests/" + caseItem.id
      const request = {parent_id: caseItem.id}
      
      const fetchData = async () => {
          const jobData = await CustomGetRequest(path, request)
          console.log('jobData', jobData)
          console.log('jobData count', jobData.count)
          if(jobData.status) {
              const count = jobData.count ?? 0
              setData({data: jobData.data, count: count})
          }
      };

      fetchData();
  }, [user.id, caseItem.id]);

  
  // Определяем, это простой вопрос-ответ или полноценное дело
  const isSimpleQA = data?.count === 1;

  // Автоматический скролл к последнему сообщению при открытии
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Блокировка прокрутки фона
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if(data === null) return (<>Не найдено...</>)
  const jobs = data.data

  // Находим последнее сообщение юриста
  const lastLawyerMessage = jobs.at(-1);

  const getStatusBadge = (status: number) => {
  
      const isValidColor = (value: number): value is QuestionStatusesE => {
          return Object.values(QuestionStatusesE).includes(value as QuestionStatusesE);
      }

      let key: keyof typeof QuestionStatusesE = "Disabled"
      if(isValidColor(status)) {
          key = QuestionStatusesE[status] as keyof typeof QuestionStatusesE
      }

      const statusMap = {
          Approved: { label: "Отвечено", color: "bg-[#10b981] text-white" },
          New: { label: "В ожидании", color: "bg-[#f59e0b] text-white" },
          Disabled: { label: "Ошибка", color: "bg-[#ef4444] text-white" },
          Spam: { label: "СПАМ", color: "bg-[#ef4444] text-white" },
          InProgress: { label: "В работе", color: "bg-[#3b82f6] text-white" },
      };

      return statusMap[key];
  };

  const statusInfo = getStatusBadge(caseItem.job_status);

  const handleRateClick = () => {
    if ([QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status)) {
      setIsRatingExpanded(!isRatingExpanded);
    }
  };

  const handleSaveRating = async () => {
    // Здесь будет логика сохранения оценки
    console.log("Сохранение оценки:", rating, comment);

    const dataRequest: RatingFormI = {
      id: caseItem.id,
      rating: rating,
      comment: comment,
    }

    const responseData = await submitRatingFormAction(dataRequest)
    if(!responseData.status) {
      console.log("Error on save rating to Question to Job", responseData.error)
      return false
    }

    const newMessage: DBQuestion = responseData.data
    console.log('handleSubmit request', newMessage)
    
    const oldData = data.data
    const newData = oldData.map(item => {
      // If the item ID matches, return a new object with the updated value
      if (item.id === newMessage.id) {
        return newMessage;
      }
      // Otherwise, return the original item object
      return item;
    });
    setData({data: newData, count: data.count});

    setIsRatingExpanded(false);
    setShowThankYou(true);
    
    // Через 3.5 секунды скрываем "Спасибо" и показываем финальное состояние
    setTimeout(() => {
      setShowThankYou(false);
      setIsRatingSubmitted(true);
      setRatingDate(newMessage.rating_date);
      setSavedComment(newMessage.comment ?? "");
    }, 3500);
  };

  const openNewQuestion = () => {
    console.log("CaseModal openNewQuestion")
    onClose()
    openNewQuestionWindow()
  }

  const handleAskClarification = async (questionOrId: string) => {
    // Если пустая строка - закрываем форму
    if (questionOrId === "") {
      setAskClarificationMessageId("");
      return;
    }
    
    // Если это текст вопроса (длинная строка) - добавляем сообщение
    if (questionOrId.length > 10) {
      const dataRequest: RequestFormI = {
        name: user.name ?? "",
        email: user.email ?? "",
        topic: caseItem.category_name,
        question: questionOrId,
        agree: true,
        parent: parseInt(caseItem.id),
      }

      const responseData = await submitRequestFormAction(dataRequest)
      if(!responseData.status) {
        console.log("Error on save new Question to Job", responseData.error)
        return false
      }

      const newMessage: DBQuestion = responseData.data
      console.log('handleSubmit request', newMessage)
      
      const newData = data.data
      newData.push(newMessage)
      const newCount = data.count + 1
      setData({data: newData, count: newCount});
      setAskClarificationMessageId("");
      setShowQuestionSaved(true);
      
      // Через 3 секунды скрываем уведомление
      setTimeout(() => {setShowQuestionSaved(false);}, 3000);
      
      // Скроллим к новому сообщению
      setTimeout(() => {messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });}, 100);
    } else {
      // Если это ID - открываем форму
      setAskClarificationMessageId(questionOrId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Оверлей */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose}/>

      {/* Модальное окно */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок модального окна */}
          <div className="bg-[#323c54] p-6 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl text-white">
                  {isSimpleQA ? `Вопрос и ответ #${caseItem.id}` : `Дело #${caseItem.id}`}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.7)] mb-1">Дата обращения: {format((new Date(caseItem.created_at)), dFormat)}</p>
              <p className="text-base text-white mt-3">{caseItem.question}</p>
              
              {/* Кнопки действий */}
              <div className="flex gap-3 mt-4">
                {/* Кнопка задать уточняющий вопрос */}
                {lastLawyerMessage && [QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status) && (
                  <button onClick={() => setAskClarificationMessageId(lastLawyerMessage.id)}
                    className="text-[#8faaba] hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="size-4" />
                    Задать уточняющий вопрос
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 ml-6">
              {/* Кнопка задать новый вопрос юристу */}
              <Link href="#" onClick={() => openNewQuestion()} 
                className="px-4 py-2 rounded-lg bg-[#8faaba] hover:bg-[#7a8fa0] text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                Задать новый вопрос юристу
              </Link>
              <button
                onClick={onClose}
                className="text-white hover:text-[#8faaba] transition-colors p-2 -mr-2 -mt-2"
                aria-label="Закрыть"
              >
                <X className="size-6" />
              </button>
            </div>
          </div>

          {/* Блок оценки под header */}
          <div className="bg-[#323c54] px-6 py-4 border-t border-[rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base text-white">
                {isRatingSubmitted ? "Ваша оценка работы юриста" : (isSimpleQA ? "Оценить работу юриста" : "Оцените консультацию")}
              </h3>
              
              {/* Компактный блок с звездами */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRateClick}
                  disabled={!!caseItem.rating || (!caseItem.rating && ![QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status))}
                  className="flex gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-7 transition-colors ${
                        star <= rating
                          ? "fill-[#fbbf24] text-[#fbbf24]"
                          : "text-[rgba(255,255,255,0.3)]"
                      } ${[QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status) ? "cursor-pointer hover:text-[#fbbf24]" : ""}`}
                      onMouseEnter={() => [QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status) && setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if ([QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status) && star) {
                          setRating(star);
                          setIsRatingExpanded(true);
                        }
                      }}
                    />
                  ))}
                </button>
              </div>
            </div>

            {/* Дата и время оценки - показывать только если оценка выставлена */}
            {isRatingSubmitted && typeof ratingDate === "string" && (
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2">Вы оценили дело {format((new Date(ratingDate)), dFormat)}</p>
            )}

            {/* Отображение сохраненного комментария */}
            {isRatingSubmitted && savedComment && (
              <div className="mt-3 p-3 rounded-lg border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)]">
                <p className="text-sm text-[rgba(255,255,255,0.8)] italic">{savedComment}</p>
              </div>
            )}

            {/* Развернутая форма оценки */}
            {isRatingExpanded && [QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status) && (
              <div className="bg-[rgba(143,170,186,0.15)] rounded-xl p-4 space-y-4 mt-4">
                {/* Крупные звезды */}
                <div>
                  <div className="flex gap-3 mb-3 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`size-10 ${
                            star <= (hoveredRating || rating) ? "fill-[#fbbf24] text-[#fbbf24]" : "text-[rgba(255,255,255,0.3)]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-[rgba(255,255,255,0.9)] text-center">Средняя оценка: 4.8</p>
                </div>

                {/* Текстовое поле */}
                <div>
                  <label className="text-xs text-[rgba(255,255,255,0.7)] mb-1 block">
                    Ваш комментарий к оценке (необязательно)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Напишите ваш комментарий..."
                    className="w-full min-h-[80px] p-3 rounded-lg bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-white text-sm placeholder:text-[rgba(255,255,255,0.4)] resize-none focus:outline-none focus:border-[#8faaba] transition-colors"
                  />
                </div>

                {/* Кнопка сохранить */}
                <button
                  onClick={handleSaveRating}
                  className="w-full py-3 px-4 rounded-lg bg-[#8faaba] hover:bg-[#7a8fa0] text-white font-medium transition-colors"
                >Сохранить оценку</button>
              </div>
            )}

            {/* Состояние "Спасибо" - анимация после первой отправки оценки */}
            {showThankYou && (
              <div className="bg-[rgba(143,170,186,0.2)] rounded-xl p-6 mt-4 text-center animate-in fade-in duration-300">
                {/* Большая галочка */}
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#8faaba] mb-4">
                  <Check className="size-10 text-white stroke-[3]" />
                </div>
                
                {/* Текст благодарности */}
                <h4 className="text-xl text-[rgba(255,255,255,0.95)] font-medium mb-2">Спасибо! Ваш отзыв учтён</h4>
                
                {/* Средняя оценка */}
                <p className="text-sm text-[rgba(255,255,255,0.8)]">Средняя оценка дела: 4.8</p>
              </div>
            )}
          </div>

          {/* Прокручиваемый контент - Ход дела */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg text-[#29282b] font-medium mb-4">
              Ход вашего дела #{caseItem.id}
            </h3>
            <div className="space-y-0">
              {jobs.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLastLawyerMessage={message.id === lastLawyerMessage?.id}
                  onAskClarification={handleAskClarification}
                  showClarificationForm={askClarificationMessageId === message.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Уведомление о сохранении вопроса */}
            {showQuestionSaved && (
              <div className="mt-4 bg-[rgba(143,170,186,0.2)] rounded-xl p-4 text-center animate-in fade-in duration-300">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-[#8faaba] mb-3">
                  <Check className="size-7 text-white stroke-[2.5]" />
                </div>
                <h4 className="text-base text-[#29282b] font-medium mb-1">Ваш вопрос сохранён</h4>
                <p className="text-sm text-[rgba(41,40,43,0.7)]">Новый вопрос отображается в переписке.</p>
              </div>
            )}

            {/* Кнопка задать уточняющий вопрос внизу */}
            {lastLawyerMessage && [QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(caseItem.job_status) && (
              <button onClick={() => setAskClarificationMessageId(lastLawyerMessage.id)}
                className="w-full mt-6 py-4 px-6 rounded-lg bg-[#8faaba] hover:bg-[#7a8fa0] text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="size-5" />
                Задать уточняющий вопрос
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}