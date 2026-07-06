'use client';

import { Suspense } from 'react';
import { V2ProfilePage } from '@/src/app/components/v2/profile-page/profile-page';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="v2-header-bleed min-h-screen bg-[#F9F9F9] text-[#12161B]">
          <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-8 lg:px-[100px]">
            <p className="text-[16px] text-[rgba(18,22,27,0.6)]">Загружается...</p>
          </section>
        </main>
      }
    >
      <V2ProfilePage />
    </Suspense>
  );
}

/*
Старый дизайн профиля сохранён на время переноса v2:

import {ProfileScreen} from '@/src/app/components/screen/Profile';

<main className="flex-1 w-full max-w-7xl mx-auto px-[20px] py-[48px]">
  <div className="mb-[32px]">
    <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[48px] text-[#29282b] text-center mb-[24px]">
      Личный кабинет пользователя
    </h1>
  </div>

  <ProfileScreen is_user={true} />
</main>
*/