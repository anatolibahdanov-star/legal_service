'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from 'next-auth'
import { format } from 'date-fns'
import { Check, MessageSquare, Star, X } from 'lucide-react'

import type { AttachmentDTO, DBQuestion } from '@/src/interfaces/db'
import { QuestionStatusesE, dFormat, statusesDesign } from '@/src/interfaces/data'
import type { CaseModalProps } from '@/src/interfaces/component'
import type { JobDataI, RatingFormI, RequestFormI } from '@/src/interfaces/form'
import { ChatMessage } from '@/src/app/components/data/ChatMessage'
import { submitRatingFormAction } from '@/src/app/components/forms/action/rating'
import { submitRequestFormAction } from '@/src/app/components/forms/action/request'
import { uploadQuestionAttachmentsAction } from '@/src/app/components/forms/action/attachments'
import { CustomGetRequest } from '@/src/libs/request'
import { useBodyScrollLock } from '@/src/app/hooks/useBodyScrollLock'
import styles from './case-modal.module.css'

const statusClassName: Record<QuestionStatusesE, string> = {
  [QuestionStatusesE.Disabled]: styles.statusDisabled,
  [QuestionStatusesE.New]: styles.statusNew,
  [QuestionStatusesE.InProgress]: styles.statusInProgress,
  [QuestionStatusesE.Spam]: styles.statusSpam,
  [QuestionStatusesE.Approved]: styles.statusApproved,
  [QuestionStatusesE.Unpaid]: styles.statusUnpaid,
}

export function V2CaseModal({
  caseItem,
  isOpen,
  onClose,
  openRatingSection,
  user,
  openNewQuestionWindow,
}: CaseModalProps) {
  const [isRatingExpanded, setIsRatingExpanded] = useState(false)
  const [rating, setRating] = useState(caseItem.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(!!caseItem.rating)
  const [showThankYou, setShowThankYou] = useState(false)
  const [ratingDate, setRatingDate] = useState(caseItem.rating_date)
  const [savedComment, setSavedComment] = useState(caseItem.comment ?? '')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [askClarificationMessageId, setAskClarificationMessageId] = useState('')
  const [showQuestionSaved, setShowQuestionSaved] = useState(false)
  const [data, setData] = useState<JobDataI | null>(null)
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, AttachmentDTO[]>>({})

  useEffect(() => {
    const path = '/requests/' + caseItem.id
    const request = { parent_id: caseItem.id }

    const fetchData = async () => {
      const jobData = await CustomGetRequest(path, request)
      if (jobData.status) {
        const count = jobData.count ?? 0
        setData({ data: jobData.data, count })
        const attData = await CustomGetRequest('/attachments/question/' + caseItem.id, { thread: '1' })
        if (attData.status && attData.data && typeof attData.data === 'object') {
          setAttachmentsMap(attData.data as Record<string, AttachmentDTO[]>)
        }
        const root = jobData.data?.[0] as DBQuestion | undefined
        if (root) {
          setRating(root.rating || 0)
          setIsRatingSubmitted(!!root.rating)
          setRatingDate(root.rating_date)
          setSavedComment(root.comment ?? '')
        }
        const answered = (jobData.data as DBQuestion[]).some(
          (m) => !!m.final_reply && m.final_reply.trim() !== '',
        )
        if (openRatingSection && answered && !root?.rating) {
          setIsRatingExpanded(true)
        } else if (!answered) {
          setIsRatingExpanded(false)
        }
      }
    }

    fetchData()
  }, [user.id, caseItem.id, openRatingSection])

  useEffect(() => {
    if (!askClarificationMessageId) return
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 80)
    return () => clearTimeout(timer)
  }, [askClarificationMessageId])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  if (data === null) {
    return (
      <>
        <div className={styles.overlay} onClick={onClose} />
        <div className={styles.shell}>
          <div className={styles.modal}>
            <p className={styles.loading}>Загрузка...</p>
          </div>
        </div>
      </>
    )
  }

  const jobs = data.data
  const isSimpleQA = data.count === 1
  const lastLawyerMessage = jobs.at(-1)
  const hasLawyerAnswer = jobs.some((m) => !!m.final_reply && m.final_reply.trim() !== '')
  const canAskClarification = [QuestionStatusesE.New, QuestionStatusesE.InProgress, QuestionStatusesE.Approved].includes(
    caseItem.job_status,
  )

  const status = statusesDesign[caseItem.job_status] ?? statusesDesign[QuestionStatusesE.Disabled]
  const statusClass = statusClassName[caseItem.job_status] ?? statusClassName[QuestionStatusesE.Disabled]

  const handleSaveRating = async () => {
    const dataRequest: RatingFormI = {
      id: caseItem.id,
      rating,
      comment,
    }

    const responseData = await submitRatingFormAction(dataRequest)
    if (!responseData.status) return false

    const newMessage: DBQuestion = responseData.data
    const newData = data.data.map((item) => (item.id === newMessage.id ? newMessage : item))
    setData({ data: newData, count: data.count })

    setIsRatingExpanded(false)
    setShowThankYou(true)

    setTimeout(() => {
      setShowThankYou(false)
      setIsRatingSubmitted(true)
      setRatingDate(newMessage.rating_date)
      setSavedComment(newMessage.comment ?? '')
    }, 3500)
  }

  const openNewQuestion = () => {
    onClose()
    openNewQuestionWindow()
  }

  const handleAskClarification = async (questionOrId: string, files?: File[]): Promise<boolean> => {
    if (questionOrId === '') {
      setAskClarificationMessageId('')
      return true
    }

    const dataRequest: RequestFormI = {
      name: user.name ?? '',
      email: user.email ?? '',
      topic: caseItem.category_name ?? '',
      question: questionOrId,
      agree: true,
      auth: '1',
      parent: parseInt(caseItem.id),
    }

    const responseData = await submitRequestFormAction(dataRequest)
    if (!responseData.status) {
      console.error(responseData.error)
      return false
    }

    const newMessage: DBQuestion = responseData.data

    if (files && files.length > 0 && newMessage?.id) {
      const uploaded = await uploadQuestionAttachmentsAction(newMessage.id, files)
      if (uploaded.ok && uploaded.attachments && uploaded.attachments.length > 0) {
        setAttachmentsMap((prev) => ({ ...prev, [String(newMessage.id)]: uploaded.attachments! }))
      }
    }

    setData({ data: [...data.data, newMessage], count: data.count + 1 })
    setAskClarificationMessageId('')
    setShowQuestionSaved(true)
    setTimeout(() => setShowQuestionSaved(false), 3000)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    return true
  }

  const openClarificationForm = () => {
    if (!lastLawyerMessage) return
    setAskClarificationMessageId(lastLawyerMessage.id)
  }

  const renderStars = (size: 'sm' | 'lg') => {
    const starClass = size === 'lg' ? styles.starLarge : styles.star
    return [1, 2, 3, 4, 5].map((star) => {
      const active = star <= (size === 'lg' ? hoveredRating || rating : rating)
      const icon = (
        <Star className={`${starClass} ${active ? styles.starActive : ''}`} />
      )

      if (size === 'lg') {
        return (
          <button
            key={star}
            type="button"
            className={styles.starBtn}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            {icon}
          </button>
        )
      }

      return (
        <button
          key={star}
          type="button"
          className={styles.starBtn}
          disabled={isRatingSubmitted || !hasLawyerAnswer}
          onMouseEnter={() => hasLawyerAnswer && !isRatingSubmitted && setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={(e) => {
            e.stopPropagation()
            if (hasLawyerAnswer && !isRatingSubmitted) {
              setRating(star)
              setIsRatingExpanded(true)
            }
          }}
        >
          {icon}
        </button>
      )
    })
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />

      <div className={styles.shell}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <header className={styles.header}>
            <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Закрыть">
              <X className={styles.icon20} />
            </button>

            <div className={styles.badges}>
              <span className={styles.caseId}>ENK-{caseItem.id}</span>
              <span className={`${styles.statusBadge} ${statusClass}`}>
                <span className={styles.statusDot} />
                {status.name}
              </span>
            </div>

            <h2 className={styles.title} title={caseItem.question}>
              {isSimpleQA ? `Вопрос и ответ #${caseItem.id}` : `Дело #${caseItem.id}`}
            </h2>
            <p className={styles.meta}>Дата обращения: {format(new Date(caseItem.created_at), dFormat)}</p>
            <div className={styles.questionBox} title={caseItem.question}>
              {caseItem.question}
            </div>

            <div className={styles.actions}>
              {lastLawyerMessage && canAskClarification && (
                <button
                  type="button"
                  onClick={openClarificationForm}
                  className={styles.btnSecondary}
                >
                  <MessageSquare className={styles.icon16} />
                  Задать уточняющий вопрос
                </button>
              )}
              <button type="button" onClick={openNewQuestion} className={styles.btnPrimary}>
                Задать новый вопрос юристу
              </button>
            </div>
          </header>

          <section className={styles.ratingSection}>
            <div className={styles.ratingHeader}>
              <h3 className={styles.ratingTitle}>
                {isRatingSubmitted
                  ? 'Ваша оценка работы юриста'
                  : isSimpleQA
                    ? 'Оценить работу юриста'
                    : 'Оцените консультацию'}
              </h3>
              {/* Hide compact stars while the form is open — large stars below are enough */}
              {(!isRatingExpanded || isRatingSubmitted || !hasLawyerAnswer) && (
                <div className={styles.stars}>{renderStars('sm')}</div>
              )}
            </div>

            {!hasLawyerAnswer && !isRatingSubmitted && (
              <p className={styles.ratingMeta}>
                Оценить работу юриста можно только после получения ответа!
              </p>
            )}

            {isRatingSubmitted && typeof ratingDate === 'string' && (
              <p className={styles.ratingMeta}>Вы оценили дело {format(new Date(ratingDate), dFormat)}</p>
            )}

            {isRatingSubmitted && savedComment && (
              <div className={styles.savedComment}>{savedComment}</div>
            )}

            {isRatingExpanded && hasLawyerAnswer && !isRatingSubmitted && (
              <div className={styles.ratingForm}>
                <div className={styles.ratingStarsLarge}>{renderStars('lg')}</div>
                <label className={styles.label}>Ваш комментарий к оценке (необязательно)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Напишите ваш комментарий..."
                  className={styles.textarea}
                />
                <button type="button" onClick={handleSaveRating} className={styles.saveBtn}>
                  Сохранить оценку
                </button>
              </div>
            )}

            {showThankYou && (
              <div className={styles.thankYou}>
                <div className={styles.thankYouIcon}>
                  <Check className={styles.icon24} />
                </div>
                <h4 className={styles.toastTitle}>Спасибо! Ваш отзыв учтён</h4>
              </div>
            )}
          </section>

          <div className={styles.body}>
            <h3 className={styles.sectionTitle}>Ход вашего дела #{caseItem.id}</h3>
            <div>
              {jobs.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  variant="v2"
                  isLastLawyerMessage={message.id === lastLawyerMessage?.id}
                  onAskClarification={handleAskClarification}
                  showClarificationForm={askClarificationMessageId === message.id}
                  showAttachments
                  allowAttachments
                  attachments={attachmentsMap[String(message.id)]}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {showQuestionSaved && (
              <div className={styles.toast}>
                <div className={styles.thankYouIcon}>
                  <Check className={styles.icon20} />
                </div>
                <h4 className={styles.toastTitle}>Ваш вопрос сохранён</h4>
                <p className={styles.toastText}>Новый вопрос отображается в переписке.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
