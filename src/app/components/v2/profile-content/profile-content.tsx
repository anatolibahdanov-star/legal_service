'use client'

import { useState } from 'react'
import type { User } from 'next-auth'
import Swal from 'sweetalert2'

import type { DBUser } from '@/src/interfaces/db'
import { isPhoneEmail } from '@/src/libs/phoneIdentity'
import { CustomRequest } from '@/src/libs/request'
import { PASSWORD_FIELDS, type ProfileField } from './profile-content.data'

interface ProfileContentProps {
  data?: DBUser | null
  user?: User | null
  setData?: (data: DBUser) => void
}

const emptyValue = 'Не указано'
type ProfileDraft = {
  name: string
  username: string
  email: string
  phone: string
}

export function ProfileContent({ data = null, user = null, setData }: ProfileContentProps) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [formData, setFormData] = useState<ProfileDraft | null>(null)
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    repeat_new_password: '',
  })

  const rawEmail = data?.email ?? user?.email ?? ''
  const email = rawEmail && !isPhoneEmail(rawEmail) ? rawEmail : ''
  const fullName = data?.name ?? user?.name ?? ''
  const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/).filter(Boolean)
  const profileDefaults: ProfileDraft = {
    name: data?.name ?? user?.name ?? '',
    username: data?.username ?? '',
    email,
    phone: data?.phone ?? '',
  }
  const profileDraft = formData ?? profileDefaults

  const personalInfoFields: ProfileField[] = [
    {
      label: 'ИМЯ',
      value: editingProfile ? profileDraft.name : firstName || fullName || emptyValue,
    },
    {
      label: 'ФАМИЛИЯ',
      value: editingProfile ? profileDraft.username : data?.username || lastNameParts.join(' ') || emptyValue,
    },
    {
      label: 'EMAIL',
      value: editingProfile ? profileDraft.email : email || emptyValue,
    },
    {
      label: 'ТЕЛЕФОН',
      value: editingProfile ? profileDraft.phone : data?.phone || emptyValue,
    },
  ]

  const handleProfileSave = async () => {
    if (!user?.id || !data) return
    setSavingProfile(true)
    const response = await CustomRequest(`/users/${user.id}`, {
      ...data,
      name: profileDraft.name,
      username: profileDraft.username,
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

  const profileFieldName = (label: string): keyof ProfileDraft => {
    if (label === 'ИМЯ') return 'name'
    if (label === 'ФАМИЛИЯ') return 'username'
    if (label === 'EMAIL') return 'email'
    return 'phone'
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
              className="flex items-center gap-2 px-4 py-[11px] bg-[rgba(18,22,27,0.05)] rounded-[12px] text-[rgba(18,22,27,0.6)] font-medium text-[14px] leading-[18px] text-center hover:bg-[rgba(18,22,27,0.08)] active:bg-[rgba(18,22,27,0.12)] transition-colors disabled:opacity-50"
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
            {personalInfoFields.map((field, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 p-4 bg-[#F7F6F9] border border-[rgba(18,22,27,0.05)] rounded-[16px]"
              >
                <label className="text-[rgba(18,22,27,0.35)] font-medium text-[12px] leading-[17px] uppercase">
                  {field.label}
                </label>
                {editingProfile ? (
                  <input
                    value={field.value === emptyValue ? '' : field.value}
                    onChange={(event) => {
                      const key = profileFieldName(field.label)
                      setFormData((prev) => ({ ...(prev ?? profileDefaults), [key]: event.target.value }))
                    }}
                    className="bg-transparent text-[#12161B] font-semibold text-[14px] leading-[20px] outline-none"
                  />
                ) : (
                  <div className="text-[#12161B] font-semibold text-[14px] leading-[20px]">
                    {field.value}
                  </div>
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
              className="flex items-center gap-2 px-4 py-[11px] bg-[rgba(18,22,27,0.05)] rounded-[12px] text-[rgba(18,22,27,0.6)] font-medium text-[14px] leading-[18px] text-center hover:bg-[rgba(18,22,27,0.08)] active:bg-[rgba(18,22,27,0.12)] transition-colors disabled:opacity-50"
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
    </div>
  )
}