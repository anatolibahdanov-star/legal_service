'use client'

import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import type { User } from 'next-auth'
import { toast } from 'sonner'

import type { DBUser } from '@/src/interfaces/db'
import { isPhoneEmail } from '@/src/libs/phoneIdentity'
import { ChangePhoneWindow } from '@/src/app/components/popups/ChangePhoneWindow'
import { COMPLETION_ITEMS } from './profile-sidebar.data'
import styles from './profile-sidebar.module.css'

interface ProfileSidebarProps {
  data?: DBUser | null
  user?: User | null
  setData?: (data: DBUser) => void
  documentsComplete?: boolean
  onEditEmail?: () => void
}

const getInitials = (value?: string | null) => {
  const source = value?.trim()
  if (!source) return 'П'
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const formatClientSince = (value?: string | Date | null) => {
  if (!value) return 'Клиент'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Клиент'
  return `Клиент с ${date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`
}

export function ProfileSidebar({
  data = null,
  user = null,
  setData,
  documentsComplete = false,
  onEditEmail,
}: ProfileSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarObjectUrlRef = useRef<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [changePhoneOpen, setChangePhoneOpen] = useState(false)

  useEffect(() => {
    let active = true
    const loadAvatar = async () => {
      const response = await fetch('/api/profile/avatar', { cache: 'no-store' })
      if (!active || !response.ok) return
      const objectUrl = URL.createObjectURL(await response.blob())
      if (!active) {
        URL.revokeObjectURL(objectUrl)
        return
      }
      avatarObjectUrlRef.current = objectUrl
      setAvatarUrl(objectUrl)
    }
    void loadAvatar()
    return () => {
      active = false
      if (avatarObjectUrlRef.current) URL.revokeObjectURL(avatarObjectUrlRef.current)
    }
  }, [user?.id])

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Поддерживаются только JPEG, PNG и WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер изображения должен быть не больше 5 МБ')
      return
    }

    setAvatarSaving(true)
    try {
      const body = new FormData()
      body.append('avatar', file)
      const response = await fetch('/api/profile/avatar', { method: 'PUT', body })
      if (response.status === 503) {
        // Avatar upload to DB is temporarily disabled — no toast.
        return
      }
      const result = await response.json() as { message?: string }
      if (!response.ok) {
        toast.error(result.message || 'Не удалось сохранить фото')
        return
      }

      if (avatarObjectUrlRef.current) URL.revokeObjectURL(avatarObjectUrlRef.current)
      const objectUrl = URL.createObjectURL(file)
      avatarObjectUrlRef.current = objectUrl
      setAvatarUrl(objectUrl)
      toast.success('Фото профиля сохранено')
    } catch {
      toast.error('Не удалось сохранить фото')
    } finally {
      setAvatarSaving(false)
    }
  }

  const handlePhoneChanged = (newPhone: string) => {
    if (data) setData?.({ ...data, phone: newPhone })
    setChangePhoneOpen(false)
    toast.success('Номер телефона успешно изменён.')
  }

  const handleCompletionAction = (key?: 'email' | 'phone' | 'photo' | 'documents') => {
    if (key === 'email') {
      onEditEmail?.()
      return
    }
    if (key === 'phone') {
      setChangePhoneOpen(true)
      return
    }
    if (key === 'photo') {
      fileInputRef.current?.click()
    }
  }

  const createdAt = (data as (DBUser & { created_at?: string | Date }) | null)?.created_at
  const rawEmail = data?.email ?? user?.email ?? ''
  const email = rawEmail && !isPhoneEmail(rawEmail) ? rawEmail : ''
  const phone = data?.phone ?? ''
  const displayName = data?.name || user?.name || data?.username || 'Пользователь'
  const initials = getInitials(displayName)
  const completionItems = COMPLETION_ITEMS.map((item) => {
    if (item.key === 'email') {
      const emailVerified = !!email && data?.email_verified === 1
      return {
        ...item,
        title: emailVerified
          ? 'Email подтверждён'
          : email
            ? 'Email не подтверждён'
            : 'Привязать email',
        description: email || 'Привязать email',
        completed: emailVerified,
      }
    }
    if (item.key === 'phone') {
      return {
        ...item,
        title: phone ? 'Телефон привязан' : 'Привязать телефон',
        description: phone || 'Привязать телефон',
        completed: !!phone,
      }
    }
    if (item.key === 'photo') {
      return {
        ...item,
        title: avatarUrl ? 'Фото привязано' : 'Привязать фото',
        description: avatarUrl ? 'Фото добавлено' : 'Привязать фото',
        completed: !!avatarUrl,
      }
    }
    return item
  })
  const completionPercent = Math.round(
    (completionItems.filter((item) => item.completed).length / completionItems.length) * 100
  )
  const showCompletion = !documentsComplete

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.banner}>
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerPattern} />
          </div>
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Аватар" className={styles.avatarImg} />
                ) : (
                  initials
                )}
              </div>
              <div className={styles.avatarBadge}>
                <div className={styles.avatarBadgeIcon}>
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.nameRow}>
            <div className={styles.nameCol}>
              <h3 className={styles.name}>{displayName}</h3>
              <div className={styles.clientSince}>
                <div className={styles.clientSinceIcon}>
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </div>
                <span>{formatClientSince(createdAt)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              className={styles.editPhotoBtn}
            >
              <div className={styles.editPhotoIcon}>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>{avatarSaving ? 'Сохраняем...' : avatarUrl ? 'Заменить фото' : 'Изменить фото'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              disabled={avatarSaving}
              className={styles.hiddenInput}
            />
          </div>
        </div>

        <div className={`${styles.body} ${showCompletion ? styles.bodyWithCompletion : ''}`}>
          <div className={styles.bodyInner}>
            {showCompletion && (
              <>
                <div className={styles.completionHeader}>
                  <h4 className={styles.completionTitle}>Готовность профиля</h4>
                  <p className={styles.completionSubtitle}>
                    Завершите настройку для доступа ко всем функциям
                  </p>

                  <div className={styles.completionProgressRow}>
                    <div className={styles.completionPercent}>{completionPercent}%</div>
                    <div className={styles.completionBarWrap}>
                      <div className={styles.completionBarTrack}>
                        <div
                          className={styles.completionBarFill}
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.itemsList}>
                  {completionItems.map((item, index) => (
                    <div
                      key={index}
                      className={`${styles.item} ${item.completed ? styles.itemCompleted : ''}`}
                    >
                      <div
                        className={`${styles.itemBadge} ${item.completed ? styles.itemBadgeCompleted : ''}`}
                      >
                        {item.completed ? (
                          <div className={styles.itemBadgeIcon}>
                            <svg viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                            </svg>
                          </div>
                        ) : (
                          <span className={styles.itemBadgeStep}>{item.step}</span>
                        )}
                      </div>

                      <div className={styles.itemBody}>
                        <div className={styles.itemTitle}>{item.title}</div>
                        <div className={styles.itemDescription}>{item.description}</div>
                      </div>

                      {!item.completed && (
                        <div className={styles.itemAction}>
                          <button
                            type="button"
                            className={styles.itemAddBtn}
                            onClick={() => handleCompletionAction(item.key)}
                          >
                            {item.key === 'email' && email ? 'Сменить' : 'Привязать'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className={styles.signOutBtn}
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>

      <ChangePhoneWindow
        isOpen={changePhoneOpen}
        currentPhone={phone}
        onClose={() => setChangePhoneOpen(false)}
        onChanged={handlePhoneChanged}
      />
    </div>
  )
}