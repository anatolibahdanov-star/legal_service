import Image from 'next/image'
import Link from 'next/link';
import SignInComponent from '@/src/app/components/SignInComponent';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#fefdf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
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

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">Задать вопрос</Link>
            <Link href="/#about" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">Почему мы?</Link>
            <Link href="/#how-it-works" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">Как это работает</Link>
            <Link href="/about" className="text-[#29282b] hover:text-[#8faaba] transition-colors cursor-pointer">О нас</Link>
          </nav>

          {/* Auth */}
          <div className="flex items-start gap-4">
            <SignInComponent />
          </div>
        </div>
      </div>
      
      {/* Thin gradient line below header */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#8faaba]/30 to-transparent"></div>
    </header>
  );
}