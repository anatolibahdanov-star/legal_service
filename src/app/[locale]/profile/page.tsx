
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route"; 
import { redirect } from 'next/navigation';
import { AuthForm } from "@/src/app/components/AuthForm";
import { RegisterForm } from "@/src/app/components/RegisterForm";
import { ResetPasswordForm } from "@/src/app/components/ResetPasswordForm";
import { UserSettingsForm } from "@/src/app/components/UserSettingsForm";
import { RequestHistoryForm } from "@/src/app/components/RequestHistoryForm";
import {ProfileQuestionList} from "@/src/app/components/data/profile-question-list"
import ProfileForm from "@/src/app/components/ProfileForm"
import ProfileList from "@/src/app/components/ProfileList"

export default async function App() {
  // const [activeForm, setActiveForm] = useState<"login" | "register" | "reset" | "settings" | "history" | null>(null);

  // return (
  //   <main className="flex-1 w-full max-w-[1216px] mx-auto px-[159px] py-[48px]">
  //     <div className="size-full relative">

  //       {/* Кнопки в правом верхнем углу */}
  //       {/* <div className="top-8 right-8 flex gap-4">
  //         <button
  //           onClick={() => setActiveForm("history")}
  //           className="bg-[#2d3b4e] h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#1d2b3e] transition-colors shadow-lg"
  //         >
  //           История
  //         </button>
  //         <button
  //           onClick={() => setActiveForm("settings")}
  //           className="bg-[#3d4b5e] h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#2d3b4e] transition-colors shadow-lg"
  //         >
  //           Настройки
  //         </button>
  //         <button
  //           onClick={() => setActiveForm("login")}
  //           className="bg-[#87b7ce] h-[60px] px-[40px] rounded-[16px] font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-center text-white hover:bg-[#6fa2b8] transition-colors shadow-lg"
  //         >
  //           Войти
  //         </button>
  //       </div> */}


        
        
  //     </div>
  //   </main>
    
  // );

  const session = await getServerSession(authOptions);
  if(!session || !session?.user) {
    redirect('/')
  }
  const user = session.user
  
  return (
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
  );
}