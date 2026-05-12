import { useState } from "react";

import { format } from 'date-fns';

import { dFormat } from "@/src/interfaces/data";
import { ChatMessagePropsI } from "@/src/interfaces/component";


export const ChatMessage = ({ message, isLastLawyerMessage, onAskClarification, showClarificationForm, isFromUser = true }: ChatMessagePropsI) => {
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  const [error, setError] = useState("");
  const [clarificationQuestion, setClarificationQuestion] = useState("");

  const userShortName = isFromUser ? "Вы" : "Юзер"
  const userFullName = isFromUser ? "Вы" : message.username
  const lawyerShortName = "Юрист"

  const needsTruncate = message.question.length > 200;
  const displayContent =
    needsTruncate && !isContentExpanded
      ? message.question.slice(0, 200) + "..."
      : message.question;

  const needsReplyTruncate = message.final_reply && message.final_reply.length > 200;
  const displayReplyContent =
    message.final_reply ? (needsReplyTruncate && !isReplyExpanded
      ? message.final_reply.slice(0, 200) + "..."
      : message.final_reply) : '';

  const createdAt = message.created_at ? format(new Date(message.created_at), dFormat) : null
  const replyCreatedAt = message.final_reply_date ? format(new Date(message.final_reply_date), dFormat) : null

  const handleSubmitClarification = () => {
    const question = clarificationQuestion.trim()
    if(question.length > 450) {
        setError("Ваш вопрос слишком длинный. Пожалуйста, сократите его до 450 символов.")
        return false
    }
    if (question) {
      if(onAskClarification) onAskClarification(question);
      setClarificationQuestion("");
    }
  };

  const onChangeClarification = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if(error && e.target.value.length < 3) {
        setError("")
    }

    if(error && e.target.value.length >= 3 && e.target.value.length < 450) {
        setError("")
    }
    
    setClarificationQuestion(e.target.value)
  }

  return (
    <>
      <div className="py-4 border-b border-[rgba(41,40,43,0.1)] last:border-b-0">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="size-12 rounded-full flex items-center justify-center shrink-0 text-sm font-medium bg-[#8faaba] text-white">{userShortName}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[#29282b]">{userFullName}</h4>
              {createdAt && (<span className="text-xs text-[rgba(41,40,43,0.5)] whitespace-nowrap ml-4">{createdAt}</span>)}
            </div>

            <p className="text-sm text-[rgba(41,40,43,0.8)] leading-relaxed whitespace-pre-wrap">{displayContent}</p>

            {needsTruncate && (
              <button onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="text-[#8faaba] text-xs hover:text-[#7a8fa0] transition-colors mt-2"
              >{isContentExpanded ? "Свернуть" : "Показать полностью"}</button>
            )}
          </div>
        </div>
      </div>

      { message.final_reply && (<div className="py-4 border-b border-[rgba(41,40,43,0.1)] last:border-b-0">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="size-12 rounded-full flex items-center justify-center shrink-0 text-sm font-medium bg-[#323c54] text-white">{lawyerShortName}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[#29282b]">{message.lawyer}</h4>
              {replyCreatedAt && (<span className="text-xs text-[rgba(41,40,43,0.5)] whitespace-nowrap ml-4">{replyCreatedAt}</span>)}
            </div>

            <div className="text-sm text-[rgba(41,40,43,0.8)] leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: displayReplyContent}} />

            {needsReplyTruncate && (
              <button onClick={() => setIsReplyExpanded(!isReplyExpanded)}
                className="text-[#8faaba] text-xs hover:text-[#7a8fa0] transition-colors mt-2"
              >{isReplyExpanded ? "Свернуть" : "Показать полностью"}</button>
            )}
          </div>
        </div>
      </div>)}
      
      {/* Follow-up question form */}
      {showClarificationForm && isLastLawyerMessage && (
        <div className="ml-16 mt-4 bg-[rgba(143,170,186,0.1)] rounded-lg p-4 space-y-3">
          <label className="text-sm text-[#29282b] font-medium block">Ваш уточняющий вопрос</label>
          <textarea value={clarificationQuestion} onChange={(e) => onChangeClarification(e)}
            placeholder="Напишите ваш вопрос..."
            className={`w-full min-h-[100px] p-3 rounded-lg bg-white border text-[#29282b] text-sm placeholder:text-[rgba(41,40,43,0.4)] resize-none focus:outline-none transition-colors ${
            error 
                ? "border-red-400 focus:border-red-500" 
                : "border-[rgba(41,40,43,0.2)] focus:border-[#8faaba]"
            }`}
          />
          {error && (
            <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                {error}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={handleSubmitClarification} disabled={!clarificationQuestion.trim()}
              className="px-6 py-2 rounded-lg bg-[#8faaba] hover:bg-[#7a8fa0] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >Отправить вопрос</button>
            <button onClick={() => {if(onAskClarification) onAskClarification("")}}
              className="px-6 py-2 rounded-lg bg-[rgba(41,40,43,0.1)] hover:bg-[rgba(41,40,43,0.15)] text-[#29282b] font-medium transition-colors"
            >Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}