import { Send } from "lucide-react";
import Image from 'next/image'
import Link from 'next/link';
import SignInComponent from '@/src/components/login-btn';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#fefdf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Лого */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image
                src="/design/logo.png"
                width="10"
                height="10"
                className="w-10 h-10 object-contain"
                alt="LLLMS logo"
              />
            </Link>
            <div>
              <div className="font-bold text-[#29282b] text-lg"><Link href="/">ЮристПро онлайн</Link></div>
              <div className="text-xs text-[#29282b]/60"><Link href="/">Быстрая юридическая помощь онлайн.</Link></div>
            </div>
          </div>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">Задать вопрос</Link>
            <Link href="#about" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">Почему мы?</Link>
            <Link href="#how-it-works" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">Как это работает</Link>
            <Link href="/about" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">О нас</Link>
          </nav>

          {/* Иконки соцсетей и кнопка */}
          <div className="flex items-center gap-4">
            {/* Telegram */}
            <a
              href="https://t.me/your_telegram"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 transition-colors"
              aria-label="Telegram"
            >
              <Image
                src="/design/telegram.svg"
                width="10"
                height="10"
                className="w-8 h-8 text-white"
                alt="LLLMS logo"
              />
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/your_whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 transition-colors"
              aria-label="WhatsApp"
            >
              <Image
                src="/design/whatsapp.svg"
                width="10"
                height="10"
                className="w-8 h-8 text-white"
                alt="LLLMS logo"
              />
            </a>

            {/* Phone */}
            <a
              href="tel:+1234567890"
              className="flex items-center justify-center w-10 h-10 transition-colors"
              aria-label="Позвонить"
            >
              <Image
                src="/design/phone.svg"
                width="10"
                height="10"
                className="w-8 h-8 text-white"
                alt="LLLMS logo"
              />
            </a>

            {/* Кнопка */}
            {/* <Link href="/" className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium">
              Задать вопрос
            </Link> */}
            <SignInComponent />
          </div>
        </div>
      </div>
      
      {/* Тонкая градиентная линия под header */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#8faaba]/30 to-transparent"></div>
    </header>
  );
}