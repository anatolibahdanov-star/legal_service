// 'use server'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PaginationControlI } from '@/src/interfaces/form';
import { profileDataQuestionsI } from '@/src/interfaces/component';
import { CustomGetRequest } from "@/src/libs/request"
import { format } from 'date-fns';
import { QuestionStatusesE, dFormat } from '@/src/interfaces/data';
import { Tooltip } from "@/src/app/components/Tooltip";
import { Star, Share2, Eye, StarOff } from "lucide-react";

export const ProfileListData = ({ id, currentPage, itemsPerPage, totalItems, onTotalItemChamge, handleShareLink, onCaseClick, isRefresh = false }: PaginationControlI) => {
    const [data, setData] = useState<profileDataQuestionsI | null>(null);

    useEffect(() => {
        const path = "/requests"
        const request = {
            page: currentPage,
            limit: itemsPerPage,
            sort: JSON.stringify(['id', 'DESC']),
            filter: JSON.stringify({user_id: id})
        }
        // Define an asynchronous function inside the effect
        const fetchData = async () => {
            const questionData = await CustomGetRequest(path, request)
            if(questionData.status) {
                const count = questionData.count ?? 0
                setData({data: questionData.data, count: count})
                if(totalItems !== count ) onTotalItemChamge(count)
            }
        };

        // Call the async function
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, isRefresh]);

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

        const statusInfo = statusMap[key];

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        );
    };

    if(data === null) {
        return (
            <div>
                <div className="text-center py-[60px]">
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[16px] text-[rgba(255,255,255,0.6)]">
                        У вас пока нет вопросов
                    </p>
                </div>
            </div>
            
        )
    }
    
    
    const questions = data.data
    const domainUrl = process.env.NEXT_PUBLIC_URL
    return (
        <div>
        {questions.map((question) => (
            <div key={question.id}
              className="grid grid-cols-[100px_1fr_150px_150px_150px_150px_140px] gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-colors last:border-b-0"
            >
              <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium">#{question.id}</div>
              <div className="text-sm text-[rgba(255,255,255,0.9)] truncate">
                <Link href={domainUrl + '/consultation/' + question.uuid + '/'} target="_blank" rel="noopener noreferrer" 
                    className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors line-clamp-2"
                >{question.question} </Link>
              </div>
              <div className="text-sm text-[rgba(255,255,255,0.7)]">{format((new Date(question.created_at)), dFormat)}</div>
              <div className="text-sm text-[rgba(255,255,255,0.7)]">
                {[QuestionStatusesE.Approved, QuestionStatusesE.Spam].includes(question.job_status) ? (
                <Link href={domainUrl + '/consultation/' + question.uuid + '/'}  target="_blank" rel="noopener noreferrer" 
                    className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors line-clamp-2"
                >Ссылка</Link>
                ) : (
                <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">
                    —
                </span>
                )}
              </div>
              <div className="flex items-center">{getStatusBadge(question.job_status)}</div>
              <div className="text-sm text-[rgba(255,255,255,0.7)]">{format((new Date(question.updated_at)), dFormat)}</div>
              <div className="flex items-center justify-center gap-2">
                <Tooltip content="Открыть дело">
                  <button
                    onClick={() => onCaseClick(question)}
                    className="p-2 rounded-lg border-2 border-[#8faaba] text-[#8faaba] hover:bg-[#8faaba] hover:text-white transition-colors"
                  >
                    <Eye className="size-5" />
                  </button>
                </Tooltip>
                <Tooltip content={question.rating ? `Изменить оценку (${question.rating})` : "Оценить"}>
                  <button
                    onClick={() => onCaseClick(question, true)}
                    className={`p-2 rounded-lg transition-colors relative ${
                      question.rating 
                        ? 'border-2 border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-white' 
                        : 'border-2 border-[rgba(255,255,255,0.4)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.9)]'
                    }`}
                  >
                    {question.rating ? (
                      <>
                        <Star className="size-5 fill-[#fbbf24]" />
                        {/* Badge с рейтингом */}
                        <span className="absolute -top-2 -right-2 bg-[#fbbf24] text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[24px] flex items-center justify-center shadow-md">
                          {question.rating}
                        </span>
                      </>
                    ) : (
                      <StarOff className="size-5" />
                    )}
                  </button>
                </Tooltip>
                <Tooltip content="Поделиться ссылкой">
                  <button
                    onClick={() => handleShareLink(question.uuid)}
                    className="p-2 rounded-lg border-2 border-[rgba(255,255,255,0.4)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.9)] transition-colors"
                  >
                    <Share2 className="size-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
        ))}
        </div>
    )
}