'use client'

import { PERSONAL_INFO_FIELDS, PASSWORD_FIELDS } from './profile-content.data'

export function ProfileContent() {
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
            <button className="flex items-center gap-2 px-4 py-[11px] bg-[rgba(18,22,27,0.05)] rounded-[12px] text-[rgba(18,22,27,0.6)] font-medium text-[14px] leading-[18px] text-center hover:bg-[rgba(18,22,27,0.08)] active:bg-[rgba(18,22,27,0.12)] transition-colors">
              <div className="w-4 h-4">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>Изменить</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PERSONAL_INFO_FIELDS.map((field, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 p-4 bg-[#F7F6F9] border border-[rgba(18,22,27,0.05)] rounded-[16px]"
              >
                <label className="text-[rgba(18,22,27,0.35)] font-medium text-[12px] leading-[17px] uppercase">
                  {field.label}
                </label>
                <div className="text-[#12161B] font-semibold text-[14px] leading-[20px]">
                  {field.value}
                </div>
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
            <button className="flex items-center gap-2 px-4 py-[11px] bg-[rgba(18,22,27,0.05)] rounded-[12px] text-[rgba(18,22,27,0.6)] font-medium text-[14px] leading-[18px] text-center hover:bg-[rgba(18,22,27,0.08)] active:bg-[rgba(18,22,27,0.12)] transition-colors">
              <div className="w-4 h-4">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>Изменить</span>
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
                <div className="text-[rgba(18,22,27,0.6)] font-semibold text-[14px] leading-[20px]">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}