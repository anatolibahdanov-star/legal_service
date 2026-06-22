'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

const BRAND = '#8faaba';

function VerifyEmailResult() {
  const params = useSearchParams();
  const status = params.get('status');
  const success = status === 'success';
  const transient = status === 'error';

  const errorText = transient
    ? 'Временная ошибка сервера. Ссылка остаётся действительной — попробуйте перейти по ней ещё раз чуть позже.'
    : 'Ссылка недействительна. Войдите в личный кабинет и запросите подтверждение ещё раз.';

  return (
    <div className="bg-[#3d4b5e] rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center border-2"
          style={{ borderColor: success ? BRAND : '#ef4444', color: success ? BRAND : '#ef4444' }}
        >
          {success ? (
            <CheckCircle2 className="h-10 w-10" strokeWidth={1.5} />
          ) : (
            <XCircle className="h-10 w-10" strokeWidth={1.5} />
          )}
        </div>

        <div className="space-y-3 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {success ? 'Ваш email подтверждён.' : 'Не удалось подтвердить email'}
          </h2>
          {!success && (
            <p className="text-sm text-white/80 leading-relaxed">{errorText}</p>
          )}
        </div>

        <div className="w-full max-w-xs">
          <Link
            href="/profile"
            className="block w-full h-12 leading-12 rounded-2xl text-base font-semibold text-white text-center transition-colors hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Перейти в личный кабинет
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex-1 w-full max-w-xl mx-auto px-[20px] py-[64px]">
      <Suspense fallback={<p className="text-center text-[#29282b]">Загрузка…</p>}>
        <VerifyEmailResult />
      </Suspense>
    </main>
  );
}
