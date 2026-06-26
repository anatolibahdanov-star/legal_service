import { Header } from '@/src/app/components/v2/header/header'
import { Footer } from '@/src/app/components/v2/footer/footer'
import { ProfileSidebar } from '@/src/app/components/v2/profile-sidebar/profile-sidebar'
import { ProfileContent } from '@/src/app/components/v2/profile-content/profile-content'

export default function ProfilePage() {
  return (
    <main id="profile-page" className="min-h-screen bg-[#F9F9F9] text-[#12161B]" style={{ fontFamily: "'Golos Text', sans-serif" }}>
      <Header isAuthenticated={true} userName="Иван Иванов" userInitials="ИИ" />
      
      <section className="px-[100px] py-[46px]">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-4">
            <h1 
              className="text-[#12161B] font-semibold leading-[56px] tracking-[-0.01em]"
              style={{ fontSize: 48 }}
            >
              Личный кабинет
            </h1>
          </div>

          <div 
            className="flex p-1 bg-gradient-to-br from-[rgba(153,153,202,0.06)] to-[rgba(165,165,221,0.06)] border border-[rgba(18,22,27,0.05)] rounded-[18px]"
            style={{ width: 420 }}
          >
            <div className="flex items-center justify-center px-6 py-[13px] bg-gradient-to-r from-[#34347C] to-[#34537C] rounded-[14px] text-white font-medium text-[18px] leading-[23px] tracking-[-0.01em]">
              Аккаунт
            </div>
            <div className="flex items-center justify-center px-6 py-[13px] rounded-[14px] text-[#12161B] font-medium text-[18px] leading-[23px] tracking-[-0.01em] cursor-pointer hover:bg-black/5 transition-colors">
              Баланс
            </div>
            <div className="flex items-center justify-center px-6 py-[13px] rounded-[14px] text-[#12161B] font-medium text-[18px] leading-[23px] tracking-[-0.01em] cursor-pointer hover:bg-black/5 transition-colors">
              Ваши заявки
            </div>
          </div>

          <div className="flex gap-12">
            <ProfileSidebar />
            <ProfileContent />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}