'use client';

import { Suspense } from 'react';
import { V2ProfilePage } from '@/src/app/components/v2/profile-page/profile-page';
import styles from '@/src/app/components/v2/profile-page/profile-page.module.css';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className={`v2-header-bleed ${styles.page}`}>
          <section className={styles.container}>
            <p className={styles.loadingText}>Загружается...</p>
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
    <h1 className="font-bold text-[48px] leading-[48px] text-[#29282b] text-center mb-[24px]">
      Личный кабинет пользователя
    </h1>
  </div>

  <ProfileScreen is_user={true} />
</main>
*/