'use client'; 

import svgPaths from "../../../imports/svg-kwtal3bey7";
import svgPathsWhatsApp from "../../../imports/svg-i8lyx75iop";
import { useState } from 'react';
import Image from 'next/image'

function EmailIcon() {
  return (
    <div className="size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.pd919a80} id="Vector" stroke="var(--stroke-0, #87B7CE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p189c1170} id="Vector_2" stroke="var(--stroke-0, #87B7CE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function PhoneIcon() {
  return (
    <div className="size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_phone)" id="Icon">
          <path d={svgPaths.p149d6300} id="Vector" stroke="var(--stroke-0, #87B7CE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
        <defs>
          <clipPath id="clip0_phone">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function LocationIcon() {
  return (
    <div className="size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p26ddc800} id="Vector" stroke="var(--stroke-0, #87B7CE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p35ba4680} id="Vector_2" stroke="var(--stroke-0, #87B7CE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function TelegramIcon() {
  return (
    <div className="relative shrink-0 size-[30px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g id="Icon">
          <path d={svgPaths.p10dccc00} fill="var(--fill-0, #87B7CE)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <div className="relative shrink-0 size-[30px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g clipPath="url(#clip0_whatsapp)" id="Icon">
          <path d={svgPathsWhatsApp.p31122e00} fill="var(--fill-0, #87B7CE)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_whatsapp">
            <rect fill="white" height="30" width="30" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function MaxIcon() {
  return (
    <div className="relative shrink-0 size-[34px]" data-name="Icon">
      <Image
        src="/assets/23b5fcc1166b9ae2664ffb6c2acaa7de6ed7a768.png"
        width={500}
        height={298}
        className="w-full h-full object-contain"
        alt="LLLMS Max"
        style={{
          filter: 'brightness(0) saturate(100%) invert(64%) sepia(17%) saturate(780%) hue-rotate(156deg) brightness(91%) contrast(87%)'
        }}
      />
    </div>
  );
}

export default function ContactInfo() {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    message: '',
    consent: false
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Форма отправлена:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ phone: '', email: '', message: '', consent: false });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-[#fefdf9] py-16 px-4">
      <div className="max-w-[1216px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[57.6px] text-[#29282b] mb-4">
            Контакты
          </h2>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[20px] leading-[32px] text-[#29282b]/70">
            Свяжитесь с нами удобным для вас способом
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Контактная информация */}
          <div className="bg-white rounded-[24px] p-8 shadow-lg border border-[#87b7ce]/20">
            <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-[#29282b] mb-6">
              Наши контакты
            </h3>

            <div className="space-y-6">
              {/* Телефоны */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <PhoneIcon />
                  <div>
                    <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-1">Телефоны</p>
                    <a href="tel:+79991234567" className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#29282b] hover:text-[#87b7ce] transition-colors">
                      +7 (999) 123-45-67
                    </a>
                  </div>
                </div>
                <div className="ml-[36px]">
                  <a href="tel:+74951234567" className="font-['Inter:Regular',sans-serif] text-[16px] text-[#29282b]/70 hover:text-[#87b7ce] transition-colors">
                    +7 (495) 123-45-67
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <EmailIcon />
                <div>
                  <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-1">Email</p>
                  <a href="mailto:info@urconsult.ru" className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#29282b] hover:text-[#87b7ce] transition-colors">
                    info@urconsult.ru
                  </a>
                </div>
              </div>

              {/* Адрес */}
              <div className="flex items-start gap-3">
                <LocationIcon />
                <div>
                  <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-1">Адрес офиса</p>
                  <p className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#29282b] mb-2">
                    г. Москва, ул. Юридическая, д. 1
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#29282b]/60">
                    Метро Китай-город, 5 минут пешком
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#29282b]/60">
                    Пн-Пт: 9:00 - 19:00, Сб: 10:00 - 16:00
                  </p>
                </div>
              </div>

              {/* Социальные сети */}
              <div className="pt-6 border-t border-[#87b7ce]/20">
                <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-4">Мессенджеры</p>
                <div className="flex gap-[10px]">
                  <a 
                    href="https://t.me/example" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-[33554400px] shrink-0 size-[40px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Telegram"
                  >
                    <TelegramIcon />
                  </a>
                  <a 
                    href="https://wa.me/79991234567" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-[33554400px] shrink-0 size-[40px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon />
                  </a>
                  <a 
                    href="https://max.com/example" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-[33554400px] shrink-0 size-[40px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Max"
                  >
                    <MaxIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Остались вопросы? */}
          <div className="flex items-stretch">
            <div className="bg-gradient-to-r from-[#3d4b5e] to-[#2a3542] rounded-[24px] p-8 w-full flex flex-col">
              <div className="text-center mb-6">
                <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[28px] text-white mb-3">
                  Остались вопросы?
                </h3>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] text-white/80">
                  Не получилось получить консультацию или нужны уточнения?<br />
                  Напишите нам — мы свяжемся с вами.
                </p>
              </div>

              {submitted ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-8 text-center flex-1 flex flex-col items-center justify-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-white mb-2">Спасибо!</h4>
                  <p className="font-['Inter:Regular',sans-serif] text-[14px] text-white/80">
                    Ваше сообщение получено. Мы свяжемся с вами в ближайшее время.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <div className="space-y-3 mb-4 flex-1">
                    <div>
                      <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] text-white/90 mb-1">
                        Телефон
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+7 ___ ___-__-__"
                        required
                        className="w-full px-3 py-2.5 rounded-[10px] border border-white/20 bg-white/10 font-['Inter:Regular',sans-serif] text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-[#87b7ce] focus:ring-2 focus:ring-[#87b7ce]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] text-white/90 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        required
                        className="w-full px-3 py-2.5 rounded-[10px] border border-white/20 bg-white/10 font-['Inter:Regular',sans-serif] text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-[#87b7ce] focus:ring-2 focus:ring-[#87b7ce]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] text-white/90 mb-1">
                        Сообщение
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Опишите ваш вопрос или проблему"
                        rows={3}
                        required
                        className="w-full px-3 py-2.5 rounded-[10px] border border-white/20 bg-white/10 font-['Inter:Regular',sans-serif] text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-[#87b7ce] focus:ring-2 focus:ring-[#87b7ce]/20 transition-all resize-none"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={formData.consent}
                        onChange={handleChange}
                        required
                        className="w-4 h-4 mr-2"
                      />
                      <label className="font-['Inter:Regular',sans-serif] text-[13px] text-white/90">
                        Я согласен с обработкой персональных данных
                      </label>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      className="w-full px-8 py-3 bg-[#87b7ce] hover:bg-[#6fa3b4] rounded-[10px] font-['Inter:Medium',sans-serif] font-medium text-[15px] text-white transition-colors shadow-lg hover:shadow-xl"
                    >
                      Связаться с нами
                    </button>
                    <p className="mt-3 font-['Inter:Regular',sans-serif] text-[12px] text-white/60 italic">
                      Ответим в ближайшее время удобным для Вас способом.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Карта Яндекс */}
        <div className="bg-white rounded-[24px] overflow-hidden shadow-lg border border-[#87b7ce]/20">
          <div className="h-full min-h-[500px]">
            <iframe
              src="https://yandex.ru/map-widget/v1/?um=constructor%3A5c9e1a0b0f0a0e0a0b0f0a0e0a0b0f0a&amp;source=constructor"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ minHeight: '500px' }}
              title="Карта офиса"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}