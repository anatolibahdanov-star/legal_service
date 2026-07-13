import {SelectField} from 'react-admin';
import { X, Star, MessageSquare, ChevronDown, ChevronUp, Check } from "lucide-react";
import { ChatMessage } from "@/src/app/components/data/ChatMessage";
import { EmailStatusesE, QuestionStatusesE, dFormat } from '@/src/interfaces/data';
import { getAdminChoices } from '@/src/helpers/tools';
import { statusesDesign, StatusColorI } from '@/src/interfaces/data';
import { format } from 'date-fns';
import { AdminJobViewPropsI } from '@/src/interfaces/component';
import { TruncatedText } from '@/src/app/components/v2/lawyer-requests/truncated-text';

export const AdminJobView = ({record, jobs, attachmentsMap}: AdminJobViewPropsI) => {
    const {id, username, category_name, job_status, created_at, lawyer, category_id, email_status} = record;
    const statusColor: StatusColorI = job_status && [0,1,2,3,4].includes(job_status) ? statusesDesign[job_status] : statusesDesign[QuestionStatusesE.New]
    const createdAt = created_at ? format(new Date(created_at), "dd.MM.yyyy hh:ii") : null
    const rating = record.rating ?? 0
    const caseTitle = `Дело #${id} от ${username ?? ''}`

    return (
        <>
            <div className="w-full bg-[#323c54] mx-auto rounded-t-[16px]">
                <div className="mx-auto px-4 py-4 sm:px-6 sm:py-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 min-w-0">
                        <div className="relative min-w-0 flex-1 overflow-hidden">
                            <TruncatedText
                              text={caseTitle}
                              className="font-medium leading-[24px] sm:leading-[32px] not-italic text-[18px] sm:text-[24px] text-white truncate block"
                              empty={caseTitle}
                            />
                        </div>
                        {statusColor && (
                          <div
                            className="relative rounded-full shrink-0 px-3 py-1 sm:px-4 sm:py-1.5"
                            style={{ background: statusColor.color }}
                          >
                            <p className="font-medium leading-[16px] text-[12px] sm:text-[13px] text-white whitespace-nowrap">
                                {statusColor.name}
                            </p>
                          </div>
                        )}
                        {(email_status || email_status === 0) && (
                            <div className="relative rounded-full shrink-0 px-4 py-1.5">
                                <SelectField label="Email" source='email_status' 
                                    choices={getAdminChoices(EmailStatusesE, "Статус отправки уведомления: ")} optionValue={'email_status'} 
                                />
                            </div>
                        )}
                    </div>
                {createdAt && (<p className="font-normal leading-[20px] text-[14px] text-[rgba(255,255,255,0.7)] mb-4">
                    Дата обращения: {createdAt}
                </p>)}
                {category_name && (<p className="font-normal leading-[20px] text-[14px] text-[rgba(255,255,255,0.7)] mb-4">
                    Категория: {category_name} ({category_id})
                </p>)}
                {lawyer && (<p className="font-normal leading-[20px] text-[14px] text-[rgba(255,255,255,0.7)] mb-4">
                    {lawyer}
                </p>)}
                </div>
            </div>

            {/* Rating block below header */}
            {record.rating && record.rating_date && (
                <div className="w-full bg-[#323c54] px-6 py-4 border-t border-[rgba(255,255,255,0.1)]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base text-white">Оценка работы юриста</h3>
                        <div className="flex items-center gap-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star}
                                    className={`size-7 transition-colors ${
                                        star <= rating ? "fill-[#fbbf24] text-[#fbbf24]" : "text-[rgba(255,255,255,0.3)]"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Rating date/time — show only if rating is set */}
                    <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2">Вы оценили дело {format((new Date(record.rating_date)), dFormat)}</p>

                    {/* Saved comment display */}
                    {record.comment && (
                        <div className="mt-3 p-3 rounded-lg border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)]">
                            <p className="text-sm text-[rgba(255,255,255,0.8)] italic">{record.comment}</p>
                        </div>
                    )}
                </div>
            )}

        {/* Messages */}
        {jobs.map((message) => (
            <ChatMessage key={'user-reply-' + message.id} message={message} isFromUser={false} isAdmin={true}
                showAttachments attachments={attachmentsMap?.[String(message.id)]} />
        ))}
    </>
    )
}