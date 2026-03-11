
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route"; 
import { redirect } from 'next/navigation';
import {ProfileQuestionList} from "@/src/app/components/data/profile-question-list"
import ProfileForm from "@/src/app/components/forms/profile"
import ProfileList from "@/src/app/components/ProfileList"

export default async function App() {
  const session = await getServerSession(authOptions);
  if(!session || !session?.user) {
    redirect('/')
  }
  const user = session.user
  
  return (
    <main className="flex-1 w-full max-w-[1216px] mx-auto px-[159px] py-[48px]">
      <div className="inset-0 bg-[#2d3b4e]">
        <div className="min-h-full p-8">
          <div className="max-w-[1200px] mx-auto">
            {/* Шапка */}
            <div className="flex items-center justify-between mb-[40px]">
              <h1 className="font-['Inter:Bold',sans-serif] font-bold leading-[48px] text-[36px] text-white">
                Личный кабинет пользователя
              </h1>
            </div>

            {/* Блок 1: Учетная запись */}
            <ProfileForm />

            {/* Блок 2: Мои вопросы */}
            <ProfileList><ProfileQuestionList id={parseInt(user.id)} /></ProfileList>
          </div>
        </div>
      </div>
    </main>
  );
}