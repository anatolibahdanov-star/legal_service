'use client'

import { useState } from 'react'
import { format } from 'date-fns'

import { dFormat } from '@/src/interfaces/data'
import { ChatMessagePropsI } from '@/src/interfaces/component'
import { stripAnalysisSection, stripEditMarks, highlightEditMarks } from '@/src/libs/grokReply'
import { AttachmentList } from '@/src/app/components/data/AttachmentList'
import { FileUpload } from '@/src/app/components/forms/FileUpload'

const legacy = {
  row: 'py-4 border-b border-[rgba(41,40,43,0.1)] last:border-b-0',
  userAvatar: 'size-12 rounded-full flex items-center justify-center shrink-0 text-sm font-medium bg-[#8faaba] text-white',
  lawyerAvatar: 'size-12 rounded-full flex items-center justify-center shrink-0 text-sm font-medium bg-[#323c54] text-white',
  name: 'text-sm font-medium text-[#29282b]',
  date: 'text-xs text-[rgba(41,40,43,0.5)] whitespace-nowrap ml-4',
  body: 'text-sm text-[rgba(41,40,43,0.8)] leading-relaxed whitespace-pre-wrap',
  link: 'text-[#8faaba] text-xs hover:text-[#7a8fa0] transition-colors mt-2',
  formWrap: 'ml-16 mt-4 bg-[rgba(143,170,186,0.1)] rounded-lg p-4 space-y-3',
  formLabel: 'text-sm text-[#29282b] font-medium block',
  formInput:
    'w-full min-h-[100px] p-3 rounded-lg bg-white border text-[#29282b] text-sm placeholder:text-[rgba(41,40,43,0.4)] resize-none focus:outline-none transition-colors',
  formInputOk: 'border-[rgba(41,40,43,0.2)] focus:border-[#8faaba]',
  formInputErr: 'border-red-400 focus:border-red-500',
  submit: 'px-6 py-2 rounded-lg bg-[#8faaba] hover:bg-[#7a8fa0] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  cancel: 'px-6 py-2 rounded-lg bg-[rgba(41,40,43,0.1)] hover:bg-[rgba(41,40,43,0.15)] text-[#29282b] font-medium transition-colors',
}

const v2 = {
  row: 'py-4 border-b border-[rgba(18,22,27,0.08)] last:border-b-0',
  userAvatar:
    'size-11 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold text-white bg-gradient-to-br from-[#34347c] to-[#34537c]',
  lawyerAvatar: 'size-11 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold bg-[#12161b] text-white',
  name: 'text-sm font-semibold text-[#12161b]',
  date: 'text-xs text-[rgba(18,22,27,0.45)] whitespace-nowrap ml-4',
  body: 'text-sm text-[rgba(18,22,27,0.75)] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]',
  link: 'text-[#34347c] text-xs font-medium hover:opacity-80 transition-opacity mt-2',
  formWrap: 'ml-14 mt-4 rounded-2xl border border-[rgba(18,22,27,0.08)] bg-[#f7f6f9] p-4 space-y-3',
  formLabel: 'text-sm font-semibold text-[#12161b] block',
  formInput:
    'w-full min-h-[100px] p-3 rounded-xl bg-white border text-[#12161b] text-sm placeholder:text-[rgba(18,22,27,0.4)] resize-none focus:outline-none transition-colors',
  formInputOk: 'border-[rgba(18,22,27,0.12)] focus:border-[#34347c]',
  formInputErr: 'border-red-400 focus:border-red-500',
  submit:
    'px-6 py-2 rounded-full bg-[radial-gradient(circle_at_50%_0%,#34347c_0%,#2d2d6c_100%)] text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
  cancel:
    'px-6 py-2 rounded-full bg-[rgba(18,22,27,0.06)] hover:bg-[rgba(18,22,27,0.1)] text-[#12161b] text-sm font-medium transition-colors',
}

export const ChatMessage = ({
  message,
  isLastLawyerMessage,
  onAskClarification,
  showClarificationForm,
  isFromUser = true,
  isAdmin = false,
  showAttachments = false,
  attachments,
  allowAttachments = false,
  variant = 'legacy',
}: ChatMessagePropsI) => {
  const t = variant === 'v2' ? v2 : legacy
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const [isReplyExpanded, setIsReplyExpanded] = useState(false)
  const [error, setError] = useState('')
  const [clarificationQuestion, setClarificationQuestion] = useState('')
  const [clarificationFiles, setClarificationFiles] = useState<File[]>([])

  const userShortName = isFromUser ? 'Вы' : 'Юзер'
  const userFullName = isFromUser ? 'Вы' : message.username
  const lawyerShortName = 'Юрист'

  const needsTruncate = message.question.length > 200
  const displayContent =
    needsTruncate && !isContentExpanded ? message.question.slice(0, 200) + '...' : message.question

  const replySource = message.final_reply
    ? isAdmin
      ? message.final_reply
      : stripAnalysisSection(message.final_reply)
    : ''
  const needsReplyTruncate = replySource.length > 200
  const truncatedReply =
    needsReplyTruncate && !isReplyExpanded ? replySource.slice(0, 200) + '...' : replySource
  const displayReplyContent = isAdmin ? highlightEditMarks(truncatedReply) : stripEditMarks(truncatedReply)

  const createdAt = message.created_at ? format(new Date(message.created_at), dFormat) : null
  const replyCreatedAt = message.final_reply_date ? format(new Date(message.final_reply_date), dFormat) : null

  const userAttachments = (attachments ?? []).filter((a) => a.source !== 'lawyer')
  const lawyerAttachments = (attachments ?? []).filter((a) => a.source === 'lawyer')

  const [submittingClarification, setSubmittingClarification] = useState(false)

  const handleSubmitClarification = async () => {
    const question = clarificationQuestion.trim()
    if (!question || submittingClarification) return
    if (!onAskClarification) return

    setSubmittingClarification(true)
    setError('')
    try {
      const ok = await onAskClarification(question, clarificationFiles)
      if (ok === false) {
        setError('Не удалось отправить вопрос. Попробуйте ещё раз.')
        return
      }
      setClarificationQuestion('')
      setClarificationFiles([])
    } finally {
      setSubmittingClarification(false)
    }
  }

  const onChangeClarification = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (error) setError('')
    setClarificationQuestion(e.target.value)
  }

  return (
    <>
      <div className={t.row}>
        <div className="flex gap-4 min-w-0">
          <div className={t.userAvatar}>{userShortName}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className={t.name}>{userFullName}</h4>
              {createdAt && <span className={t.date}>{createdAt}</span>}
            </div>
            <p className={t.body}>{displayContent}</p>
            {needsTruncate && (
              <button onClick={() => setIsContentExpanded(!isContentExpanded)} className={t.link}>
                {isContentExpanded ? 'Свернуть' : 'Показать полностью'}
              </button>
            )}
            {showAttachments && userAttachments.length > 0 && (
              <AttachmentList attachments={userAttachments} showSource={isAdmin} />
            )}
          </div>
        </div>
      </div>

      {message.final_reply && (
        <div className={t.row}>
          <div className="flex gap-4 min-w-0">
            <div className={t.lawyerAvatar}>{lawyerShortName}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className={t.name}>{message.lawyer}</h4>
                {replyCreatedAt && <span className={t.date}>{replyCreatedAt}</span>}
              </div>
              <div
                className={`${t.body} break-words [overflow-wrap:anywhere]`}
                dangerouslySetInnerHTML={{ __html: displayReplyContent }}
              />
              {needsReplyTruncate && (
                <button onClick={() => setIsReplyExpanded(!isReplyExpanded)} className={t.link}>
                  {isReplyExpanded ? 'Свернуть' : 'Показать полностью'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAttachments && lawyerAttachments.length > 0 && (
        <div className={t.row}>
          <div className="flex gap-4 min-w-0">
            <div className={t.lawyerAvatar}>Юрист</div>
            <div className="flex-1 min-w-0">
              <h4 className={`${t.name} mb-2`}>Документы от юриста</h4>
              <AttachmentList attachments={lawyerAttachments} />
            </div>
          </div>
        </div>
      )}

      {showClarificationForm && isLastLawyerMessage && (
        <div className={t.formWrap}>
          <label className={t.formLabel}>Ваш уточняющий вопрос</label>
          <textarea
            value={clarificationQuestion}
            onChange={(e) => onChangeClarification(e)}
            placeholder="Напишите ваш вопрос..."
            className={`${t.formInput} ${error ? t.formInputErr : t.formInputOk}`}
          />
          {error && <p className="text-[12px] text-red-500 ml-1">{error}</p>}
          {allowAttachments && <FileUpload files={clarificationFiles} onFilesChange={setClarificationFiles} />}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSubmitClarification}
              disabled={!clarificationQuestion.trim() || submittingClarification}
              className={t.submit}
            >
              {submittingClarification ? 'Отправка...' : 'Отправить вопрос'}
            </button>
            <button
              onClick={() => {
                setClarificationFiles([])
                if (onAskClarification) onAskClarification('')
              }}
              className={t.cancel}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  )
}
