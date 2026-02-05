import { Mail, Phone, MapPin } from "lucide-react";
import Image from 'next/image'

export function Footer() {
  return (
    <footer id="contact" className="bg-[#3d4b5e] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* О компании */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/assets/ade02f125857301f6a372fe5362b23131e9d900d.png"
                width={9}
                height={9}
                className="w-9 h-9 object-contain"
                alt="LLLMS Logo"
              />
              <div>
                <h3 className="text-lg font-bold">Адвокат онлайн</h3>
                <p className="text-xs text-white/60">Уголовные дела. Онлайн-консультации.</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Профессиональная юридическая помощь и консультации по уголовным делам.
            </p>
            <p className="text-white/70 text-sm">
              Работаем с 2014 года. Более 5000 успешных дел.
            </p>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-lg font-bold mb-4">Контакты</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#8faaba] mt-0.5 flex-shrink-0" />
                <a href="mailto:info@urconsult.ru" className="text-white/70 hover:text-white transition-colors">
                  info@urconsult.ru
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#8faaba] mt-0.5 flex-shrink-0" />
                <a href="tel:+79991234567" className="text-white/70 hover:text-white transition-colors">
                  +7 (999) 123-45-67
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#8faaba] mt-0.5 flex-shrink-0" />
                <span className="text-white/70">
                  г. Москва, ул. Юридическая, д. 1
                </span>
              </li>
            </ul>
          </div>

          {/* Режим работы */}
          <div>
            <h3 className="text-lg font-bold mb-4">Навигация</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  Почему мы
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  Как это работает
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white transition-colors">
                  О нас
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Контакты
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/70">
              © 2024 Адвокат онлайн. Все права защищены.
            </p>
            <div className="flex gap-6 text-sm text-white/70">
              <a href="/privacy_policy" className="hover:text-white transition-colors">
                Политика конфиденциальности
              </a>
              <a href="/terms_and_conditions" className="hover:text-white transition-colors">
                Пользовательское соглашение
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}