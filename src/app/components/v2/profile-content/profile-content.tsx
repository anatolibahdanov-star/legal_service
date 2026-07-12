'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from 'next-auth'
import Swal from 'sweetalert2'
import { toast } from 'sonner'
import { AlertCircle, Check } from 'lucide-react'

import type { DBUser } from '@/src/interfaces/db'
import { isPhoneEmail } from '@/src/libs/phoneIdentity'
import { CustomRequest } from '@/src/libs/request'
import { ChangePhoneWindow } from '@/src/app/components/popups/ChangePhoneWindow'
import { PASSWORD_FIELDS, type ProfileField } from './profile-content.data'
import styles from './profile-content.module.css'

type ProfileFieldKey = 'firstName' | 'lastName' | 'email' | 'phone'
type ProfileFieldWithKey = ProfileField & { key: ProfileFieldKey }

interface ProfileContentProps {
  data?: DBUser | null
  user?: User | null
  setData?: (data: DBUser) => void
  /** Increment to open profile edit and focus the email field. */
  editEmailSignal?: number
}

const emptyValue = 'Не указано'
type ProfileDraft = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function ProfileContent({
  data = null,
  user = null,
  setData,
  editEmailSignal = 0,
}: ProfileContentProps) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [changePhoneOpen, setChangePhoneOpen] = useState(false)
  const [formData, setFormData] = useState<ProfileDraft | null>(null)
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    repeat_new_password: '',
  })
  const emailInputRef = useRef<HTMLInputElement>(null)
  const lastEditEmailSignal = useRef(0)

  const rawEmail = data?.email ?? user?.email ?? ''
  const email = rawEmail && !isPhoneEmail(rawEmail) ? rawEmail : ''
  const fullName = data?.name ?? user?.name ?? ''
  const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/).filter(Boolean)
  const lastName = lastNameParts.join(' ')
  const profileDefaults: ProfileDraft = {
    firstName: firstName ?? '',
    lastName,
    email,
    phone: data?.phone ?? '',
  }
  const profileDraft = formData ?? profileDefaults

  const phoneValue = data?.phone ?? ''
  const hasRealEmail = !!email && !isPhoneEmail(rawEmail)
  const emailVerified = data?.email_verified === 1

  useEffect(() => {
    if (!editEmailSignal || editEmailSignal === lastEditEmailSignal.current) return
    lastEditEmailSignal.current = editEmailSignal
    setFormData({
      firstName: firstName ?? '',
      lastName,
      email,
      phone: data?.phone ?? '',
    })
    setEditingProfile(true)
  }, [editEmailSignal, firstName, lastName, email, data?.phone])

  useEffect(() => {
    if (!editingProfile || !editEmailSignal || editEmailSignal !== lastEditEmailSignal.current) return
    const input = emailInputRef.current
    if (!input) return
    input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input.focus()
  }, [editingProfile, editEmailSignal])

  const personalInfoFields: ProfileFieldWithKey[] = [
    {
      key: 'firstName',
      label: 'ИМЯ',
      value: editingProfile ? profileDraft.firstName : firstName || fullName || emptyValue,
    },
    {
      key: 'lastName',
      label: 'ФАМИЛИЯ',
      value: editingProfile ? profileDraft.lastName : lastName || emptyValue,
    },
    {
      key: 'email',
      label: 'EMAIL',
      value: editingProfile ? profileDraft.email : email || emptyValue,
    },
    {
      key: 'phone',
      label: 'ТЕЛЕФОН',
      value: phoneValue || emptyValue,
    },
  ]

  const handlePhoneChanged = (newPhone: string) => {
    if (data) setData?.({ ...data, phone: newPhone })
    setFormData((prev) => (prev ? { ...prev, phone: newPhone } : prev))
    setChangePhoneOpen(false)
    toast.success('Номер телефона успешно изменён.')
  }

  const handleProfileSave = async () => {
    if (!user?.id || !data) return
    setSavingProfile(true)
    const combinedName = [profileDraft.firstName, profileDraft.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ')
    const response = await CustomRequest(`/users/${user.id}`, {
      ...data,
      name: combinedName,
      email: profileDraft.email,
      phone: profileDraft.phone,
      status: data.status,
      is_super: data.is_super,
    }, 'PUT')
    setSavingProfile(false)

    if (!response.status) {
      await Swal.fire({ title: 'Ошибка', text: response.error || 'Не удалось сохранить данные.', icon: 'error' })
      return
    }

    setData?.(response.data as DBUser)
    setFormData(null)
    setEditingProfile(false)
    await Swal.fire({ title: 'Данные обновлены', icon: 'success' })
  }

  const handlePasswordSave = async () => {
    if (!user?.id || !data) return
    if (!passwordData.new_password || passwordData.new_password !== passwordData.repeat_new_password) {
      await Swal.fire({ title: 'Ошибка', text: 'Пароли не совпадают.', icon: 'error' })
      return
    }

    setSavingPassword(true)
    const response = await CustomRequest(`/users/${user.id}`, {
      ...data,
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      new_password: passwordData.new_password,
      status: data.status,
      is_super: data.is_super,
    }, 'PUT')
    setSavingPassword(false)

    if (!response.status) {
      await Swal.fire({ title: 'Ошибка', text: response.error || 'Не удалось изменить пароль.', icon: 'error' })
      return
    }

    setData?.(response.data as DBUser)
    setPasswordData({ new_password: '', repeat_new_password: '' })
    setEditingPassword(false)
    await Swal.fire({ title: 'Пароль изменён', icon: 'success' })
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h3 className={styles.cardTitle}>Личные данные</h3>
              <p className={styles.cardSubtitle}>Контактная информация аккаунта</p>
            </div>
            <button
              type="button"
              onClick={editingProfile ? handleProfileSave : () => {
                setFormData(profileDefaults)
                setEditingProfile(true)
              }}
              disabled={savingProfile}
              className={styles.editBtn}
            >
              <div className={styles.editIcon}>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>{savingProfile ? 'Сохраняем...' : editingProfile ? 'Сохранить' : 'Изменить'}</span>
            </button>
          </div>

          <div className={styles.grid}>
            {personalInfoFields.map((field) => (
              <div key={field.key} className={styles.field}>
                <label className={styles.fieldLabel}>{field.label}</label>

                {field.key === 'phone' ? (
                  <div className={styles.phoneRow}>
                    <span className={styles.fieldValue}>{field.value}</span>
                    <button
                      type="button"
                      onClick={() => setChangePhoneOpen(true)}
                      className={styles.changePhoneBtn}
                    >
                      Сменить номер
                    </button>
                  </div>
                ) : editingProfile ? (
                  <input
                    ref={field.key === 'email' ? emailInputRef : undefined}
                    value={field.value === emptyValue ? '' : field.value}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...(prev ?? profileDefaults), [field.key]: event.target.value }))
                    }}
                    className={styles.fieldInput}
                  />
                ) : (
                  <div className={styles.fieldValue}>{field.value}</div>
                )}

                {field.key === 'email' && !editingProfile && hasRealEmail && (
                  emailVerified ? (
                    <span className={`${styles.badge} ${styles.badgeVerified}`}>
                      <Check className={styles.badgeIcon} />
                      Почта подтверждена
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgePending}`}>
                      <AlertCircle className={`${styles.badgeIcon} ${styles.badgeIconTop}`} />
                      <span>Ожидает подтверждения. Письмо отправлено на {email}</span>
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardInner}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h3 className={styles.cardTitle}>Пароль</h3>
              <p className={styles.cardSubtitle}>Изменение пароля</p>
            </div>
            <button
              type="button"
              onClick={editingPassword ? handlePasswordSave : () => setEditingPassword(true)}
              disabled={savingPassword}
              className={styles.editBtn}
            >
              <div className={styles.editIcon}>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>{savingPassword ? 'Сохраняем...' : editingPassword ? 'Сохранить' : 'Изменить'}</span>
            </button>
          </div>

          <div className={styles.grid}>
            {PASSWORD_FIELDS.map((field, index) => (
              <div key={index} className={styles.field}>
                <label className={styles.fieldLabel}>{field.label}</label>
                {editingPassword ? (
                  <input
                    type="password"
                    value={index === 0 ? passwordData.new_password : passwordData.repeat_new_password}
                    onChange={(event) => {
                      const key = index === 0 ? 'new_password' : 'repeat_new_password'
                      setPasswordData((prev) => ({ ...prev, [key]: event.target.value }))
                    }}
                    className={`${styles.fieldInput} ${styles.fieldInputMuted}`}
                    placeholder={field.label}
                  />
                ) : (
                  <div className={`${styles.fieldValue} ${styles.fieldValueMuted}`}>{field.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ChangePhoneWindow
        isOpen={changePhoneOpen}
        currentPhone={phoneValue}
        onClose={() => setChangePhoneOpen(false)}
        onChanged={handlePhoneChanged}
      />
    </div>
  )
}