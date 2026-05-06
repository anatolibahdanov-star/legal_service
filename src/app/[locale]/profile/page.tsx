'use client';

import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react"
import ProfileForm from "@/src/app/components/forms/profile"
import {ProfileQuestionList} from "@/src/app/components/data/profile-question-list"
import {ProfileScreen} from '@/src/app/components/screen/Profile';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession()
 
  if (status === 'loading') {
      return <p>Загружается...</p>;
  }
  
  if(!session || !session?.user) {
    router.push('/');
    return null;
  }
  const user = session.user
  
  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-[20px] py-[48px]">
        <div className="mb-[32px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[48px] text-[#29282b] text-center mb-[24px]">
            Личный кабинет пользователя
          </h1>
        </div>

        <ProfileScreen is_user={true} />

    </main>
  );
}