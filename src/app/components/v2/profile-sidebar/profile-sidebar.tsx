'use client'

import { COMPLETION_ITEMS } from './profile-sidebar.data'

export function ProfileSidebar() {
  return (
    <div className="w-[420px] flex flex-col">
      <div className="bg-white border border-[rgba(18,22,27,0.05)] rounded-[28px] shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
        <div 
          className="relative h-[100px] rounded-t-[28px]"
          style={{
            background: 'linear-gradient(135deg, rgba(237, 233, 254, 1) 0%, rgba(238, 235, 254, 1) 13%, rgba(240, 236, 255, 1) 25%, rgba(241, 238, 255, 1) 38%, rgba(243, 240, 255, 1) 50%, rgba(240, 240, 255, 1) 57%, rgba(238, 241, 255, 1) 64%, rgba(235, 241, 255, 1) 71%, rgba(232, 241, 254, 1) 79%, rgba(230, 241, 254, 1) 86%, rgba(227, 242, 254, 1) 93%, rgba(224, 242, 254, 1) 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-40">
            <div 
              className="w-full h-full opacity-10 bg-repeat"
              style={{
                backgroundImage: 'url("/design/v2-main-page/hero-image.jpg")',
                backgroundSize: '189%',
                backgroundPosition: 'left top'
              }}
            />
          </div>
        </div>

        <div className="relative -mt-10 px-8 pb-8">
          <div className="flex items-end justify-between mb-4">
            <div className="relative">
              <div 
                className="w-[72px] h-[72px] flex items-center justify-center rounded-[20px] bg-gradient-to-r from-[#2654C0] to-[#34347C] text-white font-bold text-[22px] leading-[33px] tracking-[-0.0114em]"
                style={{ boxShadow: '0px 0px 0px 4px rgba(255, 255, 255, 1)' }}
              >
                ИИ
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#00BC7D] rounded-full flex items-center justify-center">
                <div className="w-4 h-4 text-white">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-[#12161B] font-semibold text-[20px] leading-[24px] tracking-[-0.01em] mb-1">
                Иван Иванов
              </h3>
              <div className="flex items-center gap-2 text-[rgba(18,22,27,0.5)] text-[14px] leading-[20px]">
                <div className="w-4 h-4">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </div>
                <span>Клиент с апреля 2023</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-[7px] bg-gradient-to-r from-[#34347C] to-[#34537C] border border-[rgba(255,255,255,0.15)] rounded-[12px] text-white text-[14px] leading-[20px] hover:opacity-90 active:opacity-80 transition-opacity">
              <div className="w-4 h-4">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </div>
              <span>Изменить фото</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] mt-0 p-8 pt-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h4 className="text-[#12161B] font-semibold text-[16px] leading-[20px]">
              Готовность профиля
            </h4>
            <p className="text-[rgba(18,22,27,0.5)] text-[12px] leading-[17px] font-normal">
              Завершите настройку для доступа ко всем функциям
            </p>

            <div className="flex items-center gap-6 mt-2">
              <div 
                className="text-[32px] leading-[35px] font-semibold tracking-[-0.02em]"
                style={{ 
                  background: 'radial-gradient(circle at 50% 0%, rgba(52, 52, 124, 1) 0%, rgba(45, 45, 108, 1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                50%
              </div>
              <div className="flex-1">
                <div className="w-full h-2 bg-[rgba(18,22,27,0.05)] rounded-full">
                  <div 
                    className="h-2 bg-gradient-to-r from-[#2654C0] to-[#34347C] rounded-full"
                    style={{ 
                      width: '50%',
                      boxShadow: '0px 0px 12px 0px rgba(92, 122, 240, 0.4)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[10px]">
            {COMPLETION_ITEMS.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 px-4 py-[10px] border rounded-[16px] ${
                  item.completed
                    ? 'bg-[rgba(22,163,74,0.04)] border-[rgba(22,163,74,0.12)]'
                    : 'bg-[#F9F9F9] border-[rgba(18,22,27,0.1)]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    item.completed
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[rgba(18,22,27,0.05)] text-[rgba(18,22,27,0.6)]'
                  }`}
                >
                  {item.completed ? (
                    <div className="w-4 h-4">
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    </div>
                  ) : (
                    <span className="text-[12px] font-bold leading-[15px]">{item.step}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="text-[#12161B] font-semibold text-[14px] leading-[20px]">
                    {item.title}
                  </div>
                  <div className="text-[rgba(18,22,27,0.5)] text-[12px] leading-[17px] font-normal">
                    {item.description}
                  </div>
                </div>

                {!item.completed && (
                  <div className="flex items-center justify-center">
                    <button className="px-3 py-[7px] bg-gradient-to-r from-[rgba(153,153,202,0.15)] to-[rgba(165,165,221,0.15)] rounded-full text-[#34347C] font-medium text-[12px] leading-[17px] text-center hover:opacity-80 active:opacity-60 transition-opacity">
                      Добавить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="w-full px-4 py-[13px] rounded-[24px] text-[#FB2C36] font-medium text-[14px] leading-[18px] text-center hover:bg-red-50 active:bg-red-100 transition-colors">
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  )
}