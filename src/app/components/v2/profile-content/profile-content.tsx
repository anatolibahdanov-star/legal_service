'use client'

import { useState } from 'react'
import type { User } from 'next-auth'
import Swal from 'sweetalert2'
import { toast } from 'sonner'
import { AlertCircle, Check } from 'lucide-react'

import type { DBUser } from '@/src/interfaces/db'
import { isPhoneEmail } from '@/src/libs/phoneIdentity'
import { CustomRequest } from '@/src/libs/request'
import { ChangePhoneWindow } from '@/src/app/components/popups/ChangePhoneWindow'
import { PASSWORD_FIELDS, type ProfileField } from './profile-content.data'

type ProfileFieldKey = 'firstName' | 'lastName' | 'email' | 'phone'
type ProfileFieldWithKey = ProfileField & { key: ProfileFieldKey }

interface ProfileContentProps {
  data?: DBUser | null
  user?: User | null
  setData?: (data: DBUser) => void
}

const emptyValue = 'Не указано'
type ProfileDraft = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function ProfileContent({ data = null, user = null, setData }: ProfileContentProps) {
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
    <div className="flex-1 flex flex-col gap-12">
      <div className="bg-white border border-[rgba(18,22,27,0.05)] rounded-[28px] shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)] p-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-[#12161B] font-semibold text-[20px] leading-[24px] tracking-[-0.01em]">
                Личные данные
              </h3>
              <p className="text-[rgba(18,22,27,0.6)] text-[12px] leading-[17px] font-normal">
                Контактная информация аккаунта
              </p>
            </div>
            <button
              type="button"
              onClick={editingProfile ? handleProfileSave : () => {
                setFormData(profileDefaults)
                setEditingProfile(true)
              }}
              disabled={savingProfile}
              className="flex items-center gap-2 px-4 py-[11px] bg-[rgba(18,22,27,0.05)] rounded-[12px] text-[rgba(18,22,27,0.6)] font-medium text-[14px] leading-[18px] text-center cursor-pointer hover:bg-[rgba(18,22,27,0.08)] active:bg-[rgba(18,22,27,0.12)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-4 h-4">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>{savingProfile ? 'Сохраняем...' : editingProfile ? 'Сохранить' : 'Изменить'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {personalInfoFields.map((field) => (
              <div
                key={field.key}
                className="flex flex-col gap-1 p-4 bg-[#F7F6F9] border border-[rgba(18,22,27,0.05)] rounded-[16px]"
              >
                <label className="text-[rgba(18,22,27,0.35)] font-medium text-[12px] leading-[17px] uppercase">
                  {field.label}
                </label>

                {field.key === 'phone' ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#12161B] font-semibold text-[14px] leading-[20px]">
                      {field.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChangePhoneOpen(true)}
                      className="shrink-0 rounded-[10px] border border-[rgba(52,52,124,0.3)] px-3 py-1.5 text-[12px] font-medium text-[#34347C] transition-colors cursor-pointer hover:bg-[rgba(52,52,124,0.06)] active:bg-[rgba(52,52,124,0.12)]"
                    >
                      Сменить номер
                    </button>
                  </div>
                ) : editingProfile ? (
                  <input
                    value={field.value === emptyValue ? '' : field.value}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...(prev ?? profileDefaults), [field.key]: event.target.value }))
                    }}
                    className="bg-transparent text-[#12161B] font-semibold text-[14px] leading-[20px] outline-none"
                  />
                ) : (
                  <div className="text-[#12161B] font-semibold text-[14px] leading-[20px]">
                    {field.value}
                  </div>
                )}

                {field.key === 'email' && !editingProfile && hasRealEmail && (
                  emailVerified ? (
                    <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2.5 py-1 text-[11px] font-medium text-[#059669]">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      Почта подтверждена
                    </span>
                  ) : (
                    <span className="mt-1 inline-flex w-fit items-start gap-1.5 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#b45309]">
                      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                      <span>Ожидает подтверждения. Письмо отправлено на {email}</span>
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[rgba(18,22,27,0.05)] rounded-[28px] shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)] p-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-[#12161B] font-semibold text-[20px] leading-[24px] tracking-[-0.01em]">
                Пароль
              </h3>
              <p className="text-[rgba(18,22,27,0.6)] text-[12px] leading-[17px] font-normal">
                Изменение пароля
              </p>
            </div>
            <button
              type="button"
              onClick={editingPassword ? handlePasswordSave : () => setEditingPassword(true)}
              disabled={savingPassword}
              className="flex items-center gap-2 px-4 py-[11px] bg-[rgba(18,22,27,0.05)] rounded-[12px] text-[rgba(18,22,27,0.6)] font-medium text-[14px] leading-[18px] text-center cursor-pointer hover:bg-[rgba(18,22,27,0.08)] active:bg-[rgba(18,22,27,0.12)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-4 h-4">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>{savingPassword ? 'Сохраняем...' : editingPassword ? 'Сохранить' : 'Изменить'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PASSWORD_FIELDS.map((field, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 p-4 bg-[#F7F6F9] border border-[rgba(18,22,27,0.05)] rounded-[16px]"
              >
                <label className="text-[rgba(18,22,27,0.35)] font-medium text-[12px] leading-[17px]">
                  {field.label}
                </label>
                {editingPassword ? (
                  <input
                    type="password"
                    value={index === 0 ? passwordData.new_password : passwordData.repeat_new_password}
                    onChange={(event) => {
                      const key = index === 0 ? 'new_password' : 'repeat_new_password'
                      setPasswordData((prev) => ({ ...prev, [key]: event.target.value }))
                    }}
                    className="bg-transparent text-[rgba(18,22,27,0.6)] font-semibold text-[14px] leading-[20px] outline-none"
                    placeholder={field.label}
                  />
                ) : (
                  <div className="text-[rgba(18,22,27,0.6)] font-semibold text-[14px] leading-[20px]">
                    {field.value}
                  </div>
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